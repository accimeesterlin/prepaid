import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response';
import { dbConnection, Org, Organization, Transaction, Integration, StorefrontSettings, PaymentProvider } from '@pg-prepaid/db';
import { createDingConnectService } from '@/lib/services/dingconnect.service';
import { createPGPayService } from '@/lib/services/pgpay.service';
import { logger } from '@/lib/logger';

class PaymentError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

/**
 * POST /api/v1/payments/process
 * Process a payment and send top-up
 * Public endpoint (no auth required) - used by storefront
 */
export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    await dbConnection.connect();

    body = await request.json();
    const {
      orgSlug,
      phoneNumber,
      product, // Product data from lookup
      customerEmail,
      paymentMethod,
      amount, // For variable-value products
      sendValue, // For variable-value products (amount in USD to send)
    } = body as {
      orgSlug?: string;
      phoneNumber?: string;
      product?: Record<string, unknown>;
      customerEmail?: string;
      paymentMethod?: string;
      amount?: number;
      sendValue?: number;
    };

    // Validate required fields
    if (!orgSlug || !phoneNumber || !product || !customerEmail || !paymentMethod) {
      throw new PaymentError(400, 'Missing required fields');
    }

    // Find organization by slug (check both legacy Org and new Organization models)
    logger.info('Looking up organization by slug', { orgSlug });
    const legacyOrg = await Org.findOne({ slug: orgSlug, isActive: true });
    const modernOrg = await Organization.findOne({ slug: orgSlug });

    const org = legacyOrg || modernOrg;
    const orgId = org?._id?.toString();

    if (!org || !orgId) {
      logger.error('Organization not found', { orgSlug });
      throw new PaymentError(404, 'Organization not found');
    }

    logger.info('Organization found', { orgId, orgSlug, model: legacyOrg ? 'Org' : 'Organization' });

    // Get storefront settings
    const storefrontSettings = await StorefrontSettings.findOne({ orgId });
    if (!storefrontSettings || !storefrontSettings.isActive) {
      throw new PaymentError(400, 'Storefront is not active');
    }

    logger.info('Storefront settings found', { orgId, isActive: storefrontSettings.isActive });

    // Validate product has required fields
    const productData = product as Record<string, unknown>;
    if (!productData.skuCode) {
      throw new PaymentError(400, 'Invalid product data: missing SKU code');
    }

    // Determine final amount to charge
    let finalAmount: number;
    if (productData.isVariableValue) {
      if (!amount || !sendValue) {
        throw new PaymentError(400, 'Amount is required for variable-value products');
      }
      finalAmount = parseFloat(amount.toString());
      if (productData.minAmount && productData.maxAmount) {
        if (finalAmount < Number(productData.minAmount) || finalAmount > Number(productData.maxAmount)) {
          throw new PaymentError(400, `Amount must be between ${productData.minAmount} and ${productData.maxAmount}`);
        }
      }
    } else {
      // For fixed-value products, use the pricing from product data
      const pricing = productData.pricing as Record<string, unknown> | undefined;
      finalAmount = Number(pricing?.finalPrice) || 0;
      if (finalAmount <= 0) {
        throw new PaymentError(400, 'Invalid product pricing');
      }
    }

    // Get DingConnect integration
    const integration = await Integration.findOne({
      orgId,
      provider: 'dingconnect',
      status: 'active',
    });

    if (!integration) {
      logger.error('DingConnect integration not found', { orgId });
      throw new PaymentError(400, 'DingConnect integration not configured');
    }

    logger.info('Integration found', { orgId, provider: integration.provider });

    // Initialize DingConnect service
    const dingConnect = createDingConnectService({
      apiKey: integration.credentials.apiKey as string,
    });

    // Check DingConnect balance
    try {
      const balance = await dingConnect.getBalance();
      logger.info('DingConnect balance check', {
        orgId,
        balance: balance.AccountBalance,
        currency: balance.CurrencyCode,
      });

      // Check if balance is sufficient (estimate cost as 90% of sell price)
      const estimatedCost = finalAmount * 0.9;
      if (balance.AccountBalance < estimatedCost) {
        logger.error('Insufficient DingConnect balance', {
          orgId,
          currentBalance: balance.AccountBalance,
          estimatedCost,
          currency: balance.CurrencyCode,
        });
        throw new PaymentError(400, 'Insufficient balance in DingConnect account. Please contact support.');
      }
    } catch (error) {
      if (error instanceof PaymentError) {
        throw error; // Re-throw PaymentError as-is
      }
      logger.error('Failed to check DingConnect balance', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orgId,
      });
      throw new PaymentError(500, 'Failed to verify account balance');
    }

    // Create transaction record
    const transaction = new Transaction({
      orgId,
      productId: (productData._id as string | undefined)?.toString() || `ding-${productData.skuCode}`,
      amount: finalAmount,
      currency: 'USD',
      status: 'pending',
      paymentGateway: paymentMethod,
      provider: 'dingconnect',
      recipient: {
        phoneNumber,
        email: customerEmail,
      },
      operator: {
        id: (productData.providerCode || productData.provider || 'unknown') as string,
        name: (productData.providerName || productData.name || 'unknown') as string,
        country: (productData.regionCode || 'unknown') as string,
      },
      metadata: {
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        retryCount: 0,
        // Store product details for webhook processing
        productSkuCode: (productData.providerCode || productData.skuCode) as string,
        productName: productData.name as string,
        isVariableValue: productData.isVariableValue as boolean,
        sendValue: productData.isVariableValue ? (sendValue as number) : undefined,
        benefitAmount: productData.benefitAmount as number,
        benefitUnit: productData.benefitUnit as string,
        pgpayToken: undefined,
        pgpayOrderId: undefined,
      },
      timeline: {
        createdAt: new Date(),
      },
    });

    await transaction.save();

    logger.info('Transaction created', {
      orderId: transaction.orderId,
      orgId,
      amount: finalAmount,
      phoneNumber: phoneNumber.substring(0, 5) + '***',
      productSku: productData.skuCode,
    });

    // Process payment with selected payment provider
    if (paymentMethod === 'pgpay') {
      // Get PGPay payment provider configuration
      const paymentProvider = await PaymentProvider.findOne({
        orgId,
        provider: 'pgpay',
        status: 'active',
      });

      if (!paymentProvider) {
        logger.error('PGPay payment provider not configured', { orgId });
        throw new PaymentError(400, 'PGPay payment method not configured');
      }

      logger.info('PGPay payment provider found', {
        orgId,
        environment: paymentProvider.environment,
      });

      // Initialize PGPay service
      const pgpay = createPGPayService({
        userId: paymentProvider.credentials.userId as string,
        environment: paymentProvider.environment,
      });

      // Build success and error callback URLs
      const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002';
      const successUrl = `${baseUrl}/payment/success?orderId=${transaction.orderId}`;
      const errorUrl = `${baseUrl}/payment/cancel?orderId=${transaction.orderId}`;
      const webhookUrl = `${baseUrl}/api/v1/webhooks/pgpay`;

      logger.info('Creating PGPay payment session', {
        orderId: transaction.orderId,
        amount: finalAmount,
        successUrl,
        errorUrl,
        webhookUrl,
      });

      try {
        // Create PGPay payment
        const pgpayResponse = await pgpay.createPayment({
          amount: finalAmount,
          currency: 'usd',
          orderId: transaction.orderId,
          customerEmail,
          customerFirstName: customerEmail.split('@')[0],
          customerLastName: 'Customer',
          successUrl,
          errorUrl,
          webhookUrl,
          phone: phoneNumber,
          description: `Top-up for ${phoneNumber} - ${productData.name}`,
          metadata: {
            transactionId: transaction._id?.toString(),
            productSkuCode: productData.skuCode as string,
            phoneNumber,
          },
        });

        logger.info('PGPay payment session created', {
          orderId: transaction.orderId,
          pgpayToken: pgpayResponse.token?.substring(0, 10) + '...',
        });

        // Store PGPay token in transaction metadata
        (transaction.metadata as Record<string, unknown>).pgpayToken = pgpayResponse.token;
        (transaction.metadata as Record<string, unknown>).pgpayOrderId = pgpayResponse.orderId;
        transaction.status = 'pending' as typeof transaction.status;
        await transaction.save();

        // Get checkout URL
        const checkoutUrl = pgpay.getCheckoutUrl(pgpayResponse.token);

        logger.info('Returning PGPay checkout URL', {
          orderId: transaction.orderId,
          checkoutUrl,
        });

        // Return checkout URL for redirect
        return createSuccessResponse({
          success: true,
          requiresRedirect: true,
          data: {
            orderId: transaction.orderId,
            checkoutUrl,
            pgpayToken: pgpayResponse.token,
            message: 'Redirecting to payment gateway...',
          },
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to create PGPay payment', {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          orderId: transaction.orderId,
          orgId,
        });

        transaction.status = 'failed';
        transaction.timeline.failedAt = new Date();
        transaction.metadata.failureReason = errorMessage;
        await transaction.save();

        throw new PaymentError(500, `Failed to create payment: ${errorMessage}`);
      }
    } else if (paymentMethod === 'stripe' || paymentMethod === 'paypal') {
      // TODO: Implement Stripe/PayPal integrations
      throw new PaymentError(400, `${paymentMethod} payment integration not yet implemented`);
    }

    // NOTE: Top-up will be sent after payment is confirmed via webhook
    // This ensures we only send top-ups for successful payments
    logger.error('Invalid payment method', { paymentMethod });
    throw new PaymentError(400, 'Invalid payment method');

  } catch (error) {
    logger.error('Payment processing error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      body: body,
    });

    if (error instanceof PaymentError) {
      return createErrorResponse(error.message, error.statusCode);
    }

    // Return more detailed error message
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}
