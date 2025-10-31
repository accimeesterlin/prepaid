import { NextRequest } from 'next/server';
import { dbConnection } from '@pg-prepaid/db/connection';
import { PricingRule } from '@pg-prepaid/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { requireAuth } from '@/lib/auth-middleware';

/**
 * GET /api/v1/pricing/[id]
 * Get a specific pricing rule
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request);

    await dbConnection.connect();

    const pricingRule = await PricingRule.findOne({
      _id: params.id,
      orgId: session.orgId,
    });

    if (!pricingRule) {
      return createErrorResponse('Pricing rule not found', 404);
    }

    return createSuccessResponse({ pricingRule });
  } catch (error) {
    logger.error('Error fetching pricing rule', { error });
    return handleApiError(error);
  }
}

/**
 * PATCH /api/v1/pricing/[id]
 * Update a pricing rule
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request);

    await dbConnection.connect();

    const pricingRule = await PricingRule.findOne({
      _id: params.id,
      orgId: session.orgId,
    });

    if (!pricingRule) {
      return createErrorResponse('Pricing rule not found', 404);
    }

    const body = await request.json();

    // Update fields if provided
    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return createErrorResponse('Pricing rule name cannot be empty', 400);
      }
      pricingRule.name = body.name.trim();
    }

    if (body.description !== undefined) {
      pricingRule.description = body.description?.trim() || '';
    }

    if (body.type !== undefined) {
      if (!['percentage', 'fixed'].includes(body.type)) {
        return createErrorResponse('Invalid pricing type', 400);
      }
      pricingRule.type = body.type;
    }

    if (body.value !== undefined) {
      if (body.value < 0) {
        return createErrorResponse('Pricing value must be positive', 400);
      }
      pricingRule.value = body.value;
    }

    if (body.priority !== undefined) {
      pricingRule.priority = body.priority;
    }

    if (body.isActive !== undefined) {
      pricingRule.isActive = body.isActive;
    }

    if (body.applicableCountries !== undefined) {
      pricingRule.applicableCountries = body.applicableCountries || [];
    }

    if (body.applicableRegions !== undefined) {
      pricingRule.applicableRegions = body.applicableRegions || [];
    }

    if (body.excludedCountries !== undefined) {
      pricingRule.excludedCountries = body.excludedCountries || [];
    }

    if (body.minTransactionAmount !== undefined) {
      pricingRule.minTransactionAmount = body.minTransactionAmount || null;
    }

    if (body.maxTransactionAmount !== undefined) {
      pricingRule.maxTransactionAmount = body.maxTransactionAmount || null;
    }

    await pricingRule.save();

    logger.info('Updated pricing rule', {
      orgId: session.orgId,
      pricingRuleId: pricingRule._id,
    });

    return createSuccessResponse({ pricingRule });
  } catch (error) {
    logger.error('Error updating pricing rule', { error });
    return handleApiError(error);
  }
}

/**
 * DELETE /api/v1/pricing/[id]
 * Delete a pricing rule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request);

    await dbConnection.connect();

    const pricingRule = await PricingRule.findOneAndDelete({
      _id: params.id,
      orgId: session.orgId,
    });

    if (!pricingRule) {
      return createErrorResponse('Pricing rule not found', 404);
    }

    logger.info('Deleted pricing rule', {
      orgId: session.orgId,
      pricingRuleId: params.id,
    });

    return createSuccessResponse({ message: 'Pricing rule deleted successfully' });
  } catch (error) {
    logger.error('Error deleting pricing rule', { error });
    return handleApiError(error);
  }
}
