/**
 * Customer Transaction Endpoint
 * POST /api/v1/customer-transactions
 *
 * Allows authenticated customers to send top-ups using their balance
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { dbConnection, Transaction, Customer, Integration } from "@pg-prepaid/db";
import { ApiErrors, handleApiError } from "@/lib/api-error";
import { createSuccessResponse } from "@/lib/api-response";
import { requireVerifiedCustomer } from "@/lib/auth-middleware";
import { createDingConnectService } from "@/lib/services/dingconnect.service";
import { logger } from "@/lib/logger";

const sendTopupSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number is required"),
  skuCode: z.string().min(1, "Product SKU is required"),
  amount: z.number().optional(), // For variable-value products
  sendValue: z.number().optional(), // For variable-value products
});

export async function POST(request: NextRequest) {
  try {
    await dbConnection.connect();

    // Require verified customer authentication
    const session = await requireVerifiedCustomer(request);

    // Parse and validate request body
    const body = await request.json();
    const data = sendTopupSchema.parse(body);

    // Get customer details
    const customer = await Customer.findById(session.customerId);

    if (!customer) {
      throw ApiErrors.NotFound("Customer not found");
    }

    // Get DingConnect integration for this organization
    const integration = await Integration.findOne({
      orgId: session.orgId,
      provider: "dingconnect",
      status: "active",
    }).select("+credentials.apiKey");

    if (!integration || !integration.credentials?.apiKey) {
      throw ApiErrors.BadRequest("Service provider not configured");
    }

    // Initialize DingConnect service
    const dingConnect = createDingConnectService({
      apiKey: integration.credentials.apiKey,
    });

    // Lookup product details from DingConnect
    logger.info("Looking up product from DingConnect", {
      skuCode: data.skuCode,
      customerId: session.customerId,
    });

    let productDetails;
    try {
      const products = await dingConnect.getProducts({
        skuCodes: [data.skuCode],
      });

      if (!products || products.length === 0) {
        throw ApiErrors.NotFound("Product not found");
      }

      productDetails = products[0];
    } catch (error) {
      logger.error("Failed to fetch product from DingConnect", {
        error: error instanceof Error ? error.message : "Unknown error",
        skuCode: data.skuCode,
      });
      throw ApiErrors.BadRequest("Failed to fetch product details");
    }

    // Determine the cost
    let cost: number;
    let sendValue: number;

    // Check if this is a variable-value product
    const isVariableValue = !!(productDetails.Minimum && productDetails.Maximum);

    if (isVariableValue) {
      if (!data.amount || !data.sendValue) {
        throw ApiErrors.BadRequest("Amount and sendValue required for variable-value products");
      }

      cost = data.amount;
      sendValue = data.sendValue;

      // Validate amount is within range
      const minAmount = productDetails.Minimum?.SendValue || 0;
      const maxAmount = productDetails.Maximum?.SendValue || 999999;

      if (sendValue < minAmount || sendValue > maxAmount) {
        throw ApiErrors.BadRequest(
          `Amount must be between ${minAmount} and ${maxAmount}`
        );
      }
    } else {
      // Fixed-value product - use the price from DingConnect
      cost = productDetails.Price?.SendValue || 0;
      sendValue = cost;

      if (cost <= 0) {
        throw ApiErrors.BadRequest("Invalid product pricing");
      }
    }

    // Check customer balance
    if (customer.currentBalance < cost) {
      throw ApiErrors.BadRequest(
        `Insufficient balance. Required: ${customer.balanceCurrency} ${cost.toFixed(2)}, Available: ${customer.balanceCurrency} ${customer.currentBalance.toFixed(2)}`
      );
    }

    // Create transaction record
    const transaction = new Transaction({
      orgId: session.orgId,
      customerId: session.customerId,
      productId: `ding-${data.skuCode}`,
      amount: cost,
      currency: customer.balanceCurrency || "USD",
      status: "pending",
      paymentGateway: "balance",
      paymentType: "balance",
      provider: "dingconnect",
      recipient: {
        phoneNumber: data.phoneNumber,
        email: session.email,
      },
      operator: {
        id: productDetails.ProviderCode || "unknown",
        name: productDetails.Provider?.Name || "unknown",
        country: productDetails.CountryIso || "unknown",
      },
      metadata: {
        productSkuCode: data.skuCode,
        productName: productDetails.ProductName || "Top-up",
        isVariableValue,
        sendValue,
        benefitAmount: productDetails.BenefitTypes?.Airtime?.Amount || 0,
        benefitUnit: productDetails.BenefitTypes?.Airtime?.Unit || "",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
      timeline: {
        createdAt: new Date(),
      },
    });

    await transaction.save();

    logger.info("Customer transaction created", {
      orderId: transaction.orderId,
      customerId: session.customerId,
      amount: cost,
      phoneNumber: data.phoneNumber.substring(0, 5) + "***",
    });

    // Deduct from customer balance immediately (optimistic)
    customer.currentBalance -= cost;
    customer.totalUsed += cost;
    await customer.save();

    logger.info("Customer balance deducted", {
      customerId: session.customerId,
      deducted: cost,
      newBalance: customer.currentBalance,
    });

    // Send top-up via DingConnect
    try {
      logger.info("Sending top-up via DingConnect", {
        orderId: transaction.orderId,
        skuCode: data.skuCode,
        phoneNumber: data.phoneNumber.substring(0, 5) + "***",
        isVariableValue,
        sendValue: isVariableValue ? sendValue : undefined,
      });

      const transferResult = await dingConnect.sendTransfer({
        skuCode: data.skuCode,
        accountNumber: data.phoneNumber,
        sendValue: isVariableValue ? sendValue : undefined,
      });

      logger.info("DingConnect transfer successful", {
        orderId: transaction.orderId,
        transferId: transferResult.TransferId,
        status: transferResult.Status,
      });

      // Update transaction with success
      transaction.status = "completed";
      transaction.providerTransactionId = String(transferResult.TransferId);
      transaction.timeline.completedAt = new Date();
      transaction.metadata.dingTransferId = transferResult.TransferId;
      transaction.metadata.dingStatus = transferResult.Status;

      await transaction.save();

      return createSuccessResponse({
        success: true,
        message: "Top-up sent successfully",
        transaction: {
          id: String(transaction._id),
          orderId: transaction.orderId,
          amount: cost,
          status: transaction.status,
          recipientPhone: data.phoneNumber,
          transferId: transferResult.TransferId,
        },
        balance: {
          current: customer.currentBalance,
          currency: customer.balanceCurrency,
        },
      });
    } catch (error) {
      // Top-up failed - refund customer balance
      logger.error("DingConnect transfer failed - refunding customer", {
        error: error instanceof Error ? error.message : "Unknown error",
        orderId: transaction.orderId,
        customerId: session.customerId,
        refundAmount: cost,
      });

      // Refund balance
      customer.currentBalance += cost;
      customer.totalUsed -= cost;
      await customer.save();

      // Update transaction status
      transaction.status = "failed";
      transaction.timeline.failedAt = new Date();
      transaction.metadata.failureReason =
        error instanceof Error ? error.message : "Unknown error";
      await transaction.save();

      throw ApiErrors.Internal(
        `Failed to send top-up: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(ApiErrors.BadRequest(error.errors[0].message));
    }
    return handleApiError(error);
  }
}
