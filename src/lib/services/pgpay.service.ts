import { logger } from '@/lib/logger';

/**
 * PGPay API Service
 * Handles payment creation and verification with PGPay
 * Documentation: https://docs.pgecom.com
 */

export interface PGPayCredentials {
  userId: string; // UUID format
  environment: 'sandbox' | 'production';
}

export interface PGPayPaymentRequest {
  amount: number;
  currency?: 'htg' | 'usd'; // Default: 'usd'
  orderId?: string; // Optional internal reference
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  successUrl: string;
  errorUrl: string;
  phone?: string;
  description?: string;
  metadata?: Record<string, any>;
  paymentMethods?: string[];
  webhookUrl?: string;
}

export interface PGPayPaymentResponse {
  token: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  redirectUrl: string; // PGPay returns the checkout URL
  // Additional fields returned by PGPay
  [key: string]: any;
}

export interface PGPayVerificationRequest {
  pgPayToken: string;
}

export interface PGPayVerificationResponse {
  orderId: string;
  status: 'completed' | 'pending' | 'failed';
  amount: number;
  paymentStatus: string;
  // Additional transaction details
  [key: string]: any;
}

export class PGPayService {
  private userId: string;
  private baseUrl: string;

  constructor(credentials: PGPayCredentials) {
    this.userId = credentials.userId;
    this.baseUrl =
      credentials.environment === 'sandbox'
        ? 'https://sandbox.pgecom.com/api/pgpay'
        : 'https://api.pgecom.com/api/pgpay';

    logger.info('PGPay service initialized', {
      environment: credentials.environment,
      baseUrl: this.baseUrl,
    });
  }

  /**
   * Create a new payment
   * POST /api/pgpay/token
   */
  async createPayment(request: PGPayPaymentRequest): Promise<PGPayPaymentResponse> {
    const url = `${this.baseUrl}/token`;

    const payload = {
      userID: this.userId,
      amount: request.amount,
      currency: request.currency || 'usd',
      orderId: request.orderId,
      customerEmail: request.customerEmail,
      customerFirstName: request.customerFirstName,
      customerLastName: request.customerLastName,
      successUrl: request.successUrl,
      errorUrl: request.errorUrl,
      phone: request.phone,
      description: request.description,
      metadata: request.metadata,
      paymentMethods: request.paymentMethods,
      webhookUrl: request.webhookUrl,
    };

    logger.info('Creating PGPay payment', {
      amount: request.amount,
      currency: request.currency || 'usd',
      orderId: request.orderId,
      customerEmail: request.customerEmail,
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('PGPay payment creation failed', {
          status: response.status,
          error: data.message || data,
        });
        throw new Error(data.message || 'Failed to create PGPay payment');
      }

      logger.info('PGPay payment created successfully', {
        token: data.token?.substring(0, 10) + '...',
        orderId: data.orderId,
      });

      return data;
    } catch (error: any) {
      logger.error('Error creating PGPay payment', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Verify a payment using token
   * POST /api/pgpay/order
   */
  async verifyPayment(request: PGPayVerificationRequest): Promise<PGPayVerificationResponse> {
    const url = `${this.baseUrl}/order`;

    const payload = {
      pgPayToken: request.pgPayToken,
    };

    logger.info('Verifying PGPay payment', {
      token: request.pgPayToken.substring(0, 10) + '...',
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('PGPay payment verification failed', {
          status: response.status,
          error: data.message || data,
        });
        throw new Error(data.message || 'Failed to verify PGPay payment');
      }

      logger.info('PGPay payment verified successfully', {
        orderId: data.orderId,
        status: data.status,
        paymentStatus: data.paymentStatus,
        amount: data.amount,
      });

      return data;
    } catch (error: any) {
      logger.error('Error verifying PGPay payment', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Test connection to PGPay API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const testPayload: PGPayPaymentRequest = {
        amount: 1, // PGPay minimum is 1
        currency: 'usd',
        orderId: `test-${Date.now()}`,
        customerEmail: 'test@example.com',
        customerFirstName: 'Test',
        customerLastName: 'Connection',
        successUrl: '/success',
        errorUrl: '/error',
        description: 'Connection test - do not complete',
      };

      await this.createPayment(testPayload);

      return {
        success: true,
        message: 'PGPay connection test successful',
      };
    } catch (error: any) {
      // If we get an "already exists" error, it means the API is working
      if (error.message && error.message.includes('already exist')) {
        return {
          success: true,
          message: 'PGPay connection verified',
        };
      }

      return {
        success: false,
        message: error.message || 'Connection test failed',
      };
    }
  }

  /**
   * Get payment checkout URL
   * This would redirect the customer to PGPay's hosted payment page
   */
  getCheckoutUrl(token: string): string {
    const checkoutBase =
      this.baseUrl.includes('sandbox')
        ? 'https://sandbox.pgecom.com/checkout'
        : 'https://checkout.pgecom.com';

    return `${checkoutBase}/${token}`;
  }
}

/**
 * Factory function to create PGPay service instance
 */
export function createPGPayService(credentials: PGPayCredentials): PGPayService {
  return new PGPayService(credentials);
}

/**
 * Helper to validate PGPay User ID format
 */
export function isValidPGPayUserId(userId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(userId);
}
