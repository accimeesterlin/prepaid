import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response';
import { dbConnection, Transaction, Integration, StorefrontSettings, PaymentProvider } from '@pg-prepaid/db';
import { createDingConnectService } from '@/lib/services/dingconnect.service';
import { createPGPayService } from '@/lib/services/pgpay.service';
import { logger } from '@/lib/logger';

/**
 * POST /api/v1/webhooks/pgpay
 * Handle PGPay payment webhook callbacks
 * Public endpoint - no auth required (PGPay calls this)
 */
export async function POST(request: NextRequest) {
  let webhookData: unknown;

  try {
    await dbConnection.connect();

    const data = await request.json();
    webhookData = data;

    logger.info('PGPay webhook received', {
      data: webhookData,
    });

    const { pgPayToken } = data as { pgPayToken?: string };

    if (!pgPayToken) {
      logger.error('PGPay webhook missing token', { webhookData });
      return createErrorResponse('Missing pgPayToken', 400);
    }

    // Find transaction by PGPay token
    const transaction = await Transaction.findOne({
      'metadata.pgpayToken': pgPayToken,
    });

    if (!transaction) {
      logger.error('Transaction not found for PGPay token', {
        pgPayToken: pgPayToken.substring(0, 10) + '...',
      });
      return createErrorResponse('Transaction not found', 404);
    }

    logger.info('Transaction found for webhook', {
      orderId: transaction.orderId,
      transactionId: transaction._id?.toString(),
      currentStatus: transaction.status,
    });

    // If already completed or failed, skip processing
    if (transaction.status === 'completed' || transaction.status === 'failed') {
      logger.info('Transaction already processed', {
        orderId: transaction.orderId,
        status: transaction.status,
      });
      return createSuccessResponse({
        success: true,
        message: 'Transaction already processed',
      });
    }

    // Get payment provider to verify payment
    const paymentProvider = await PaymentProvider.findOne({
      orgId: transaction.orgId,
      provider: 'pgpay',
      status: 'active',
    });

    if (!paymentProvider) {
      logger.error('PGPay payment provider not found', {
        orgId: transaction.orgId,
      });
      return createErrorResponse('Payment provider not configured', 500);
    }

    // Initialize PGPay service to verify payment
    const pgpay = createPGPayService({
      userId: paymentProvider.credentials.userId as string,
      environment: paymentProvider.environment,
    });

    logger.info('Verifying PGPay payment', {
      orderId: transaction.orderId,
      pgPayToken: pgPayToken.substring(0, 10) + '...',
    });

    // Verify payment with PGPay
    let verificationResult;
    try {
      verificationResult = await pgpay.verifyPayment({ pgPayToken });

      logger.info('PGPay verification result', {
        orderId: transaction.orderId,
        status: verificationResult.status,
        paymentStatus: verificationResult.paymentStatus,
        amount: verificationResult.amount,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to verify PGPay payment', {
        error: errorMessage,
        orderId: transaction.orderId,
      });

      transaction.status = 'failed';
      transaction.timeline.failedAt = new Date();
      transaction.metadata.failureReason = 'Payment verification failed: ' + errorMessage;
      await transaction.save();

      return createErrorResponse('Payment verification failed', 500);
    }

    // Check payment status
    if (verificationResult.status !== 'completed' || verificationResult.paymentStatus !== 'paid') {
      logger.warn('Payment not completed', {
        orderId: transaction.orderId,
        status: verificationResult.status,
        paymentStatus: verificationResult.paymentStatus,
      });

      // Update transaction but don't fail yet - payment might still be processing
      transaction.status = 'pending';
      (transaction.metadata as Record<string, unknown>).lastWebhookCheck = new Date();
      await transaction.save();

      return createSuccessResponse({
        success: true,
        message: 'Payment not yet completed',
      });
    }

    // Payment verified successfully - update transaction
    transaction.status = 'paid';
    transaction.timeline.paidAt = new Date();
    (transaction.metadata as Record<string, unknown>).pgpayVerification = verificationResult;
    await transaction.save();

    logger.info('Payment verified successfully', {
      orderId: transaction.orderId,
      amount: verificationResult.amount,
    });

    // Get DingConnect integration to send top-up
    const integration = await Integration.findOne({
      orgId: transaction.orgId,
      provider: 'dingconnect',
      status: 'active',
    });

    if (!integration) {
      logger.error('DingConnect integration not found', {
        orgId: transaction.orgId,
      });

      transaction.status = 'failed';
      transaction.timeline.failedAt = new Date();
      transaction.metadata.failureReason = 'DingConnect integration not configured';
      await transaction.save();

      return createErrorResponse('DingConnect integration not configured', 500);
    }

    // Get storefront settings
    const storefrontSettings = await StorefrontSettings.findOne({
      orgId: transaction.orgId,
    });

    if (!storefrontSettings) {
      logger.error('Storefront settings not found', {
        orgId: transaction.orgId,
      });

      transaction.status = 'failed';
      transaction.timeline.failedAt = new Date();
      transaction.metadata.failureReason = 'Storefront settings not found';
      await transaction.save();

      return createErrorResponse('Storefront settings not found', 500);
    }

    // Initialize DingConnect service
    const dingConnect = createDingConnectService({
      apiKey: integration.credentials.apiKey as string,
    });

    // Send top-up via DingConnect
    transaction.status = 'processing';
    transaction.timeline.processingAt = new Date();
    await transaction.save();

    try {
      const validateOnly = storefrontSettings.topupSettings?.validateOnly || false;

      // Get product details from transaction metadata
      const metadata = transaction.metadata as Record<string, unknown>;
      const productSkuCode = (metadata.productSkuCode as string | undefined) || transaction.productId;
      const phoneNumber = transaction.recipient?.phoneNumber;
      const sendValue = metadata.sendValue as number | undefined;
      const isVariableValue = metadata.isVariableValue as boolean | undefined;

      if (!productSkuCode || !phoneNumber) {
        throw new Error('Missing product SKU or phone number in transaction');
      }

      const transferRequest: Record<string, unknown> = {
        SkuCode: productSkuCode,
        AccountNumber: phoneNumber,
        ValidateOnly: validateOnly,
        DistributorRef: transaction.orderId,
      };

      // For variable-value products, include SendValue
      if (isVariableValue && sendValue) {
        transferRequest.SendValue = typeof sendValue === 'string' ? parseFloat(sendValue) : sendValue;
        transferRequest.SendCurrencyIso = 'USD';
      }

      logger.info('Sending DingConnect transfer', {
        orderId: transaction.orderId,
        orgId: transaction.orgId,
        skuCode: productSkuCode,
        phoneNumber: phoneNumber.substring(0, 5) + '***',
        validateOnly,
        isVariableValue,
        sendValue: isVariableValue ? sendValue : undefined,
      });

      const transferResult = await dingConnect.sendTransfer(transferRequest as any);

      logger.info('DingConnect transfer result', {
        orderId: transaction.orderId,
        transferId: transferResult.TransferId,
        status: transferResult.Status,
      });

      // Update transaction with provider details
      transaction.providerTransactionId = transferResult.TransferId?.toString();

      if (transferResult.Status === 'Completed' || validateOnly) {
        transaction.status = 'completed';
        transaction.timeline.completedAt = new Date();

        logger.info('Transaction completed successfully', {
          orderId: transaction.orderId,
          transferId: transferResult.TransferId,
          validateOnly,
        });

        // Update storefront metadata
        if (storefrontSettings.metadata) {
          const previousOrders = storefrontSettings.metadata.totalOrders || 0;
          const previousRevenue = storefrontSettings.metadata.totalRevenue || 0;

          storefrontSettings.metadata.totalOrders = previousOrders + 1;
          storefrontSettings.metadata.totalRevenue = previousRevenue + transaction.amount;
          storefrontSettings.metadata.lastOrderAt = new Date();
          await storefrontSettings.save();

          logger.info('Storefront metadata updated', {
            orgId: transaction.orgId,
            totalOrders: storefrontSettings.metadata.totalOrders,
            totalRevenue: storefrontSettings.metadata.totalRevenue,
          });
        }
      } else if (transferResult.Status === 'Failed') {
        transaction.status = 'failed';
        transaction.timeline.failedAt = new Date();
        transaction.metadata.failureReason = transferResult.ErrorMessage || 'Unknown error';

        logger.error('Transaction failed at DingConnect', {
          orderId: transaction.orderId,
          errorMessage: transferResult.ErrorMessage,
        });
      } else {
        // Processing status remains
        logger.info('Transaction still processing', {
          orderId: transaction.orderId,
          status: transferResult.Status,
        });
      }

      await transaction.save();

      logger.info('Webhook processing completed successfully', {
        orderId: transaction.orderId,
        status: transaction.status,
      });

      return createSuccessResponse({
        success: true,
        message: 'Payment confirmed and top-up sent',
        data: {
          orderId: transaction.orderId,
          status: transaction.status,
        },
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to send DingConnect transfer', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        orderId: transaction.orderId,
      });

      transaction.status = 'failed';
      transaction.timeline.failedAt = new Date();
      transaction.metadata.failureReason = errorMessage;
      await transaction.save();

      return createErrorResponse(`Failed to send top-up: ${errorMessage}`, 500);
    }

  } catch (error) {
    logger.error('Webhook processing error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      webhookData,
    });

    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}
