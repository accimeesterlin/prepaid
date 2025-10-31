import { NextRequest } from 'next/server';
import { dbConnection } from '@pg-prepaid/db/connection';
import { PaymentProvider, Org, Organization } from '@pg-prepaid/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api-error';
import { logger } from '@/lib/logger';

/**
 * GET /api/v1/storefront/payment-methods?orgSlug=xxx
 * Get active payment methods for an organization's storefront
 * Public endpoint - no auth required
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnection.connect();

    const { searchParams } = new URL(request.url);
    const orgSlug = searchParams.get('orgSlug');

    logger.info('Payment methods request', { orgSlug });

    if (!orgSlug) {
      return createErrorResponse('Organization slug is required', 400);
    }

    // Look up organization by slug
    const org = await Org.findOne({ slug: orgSlug });
    const organization = await Organization.findOne({ slug: orgSlug });
    const orgId = org?._id?.toString() || organization?._id?.toString();

    if (!orgId) {
      logger.error('Organization not found', { orgSlug });
      return createErrorResponse('Organization not found', 404);
    }

    // Get active payment providers for this organization
    const paymentProviders = await PaymentProvider.find({
      orgId,
      status: 'active',
    }).select('provider environment settings.acceptedCurrencies settings.minAmount settings.maxAmount');

    logger.info('Payment providers found', {
      orgId,
      count: paymentProviders.length,
      providers: paymentProviders.map(p => p.provider),
    });

    // Map to public-facing format (don't expose credentials)
    const availableMethods = paymentProviders.map(p => ({
      provider: p.provider,
      environment: p.environment,
      acceptedCurrencies: p.settings.acceptedCurrencies,
      minAmount: p.settings.minAmount,
      maxAmount: p.settings.maxAmount,
    }));

    return createSuccessResponse({
      available: availableMethods.length > 0,
      methods: availableMethods,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('Error fetching payment methods', {
      error: errorMessage,
      stack: errorStack,
    });
    return handleApiError(error);
  }
}
