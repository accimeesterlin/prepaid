import { NextRequest } from 'next/server';
import { dbConnection } from '@pg-prepaid/db/connection';
import { PricingRule } from '@pg-prepaid/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { requireAuth } from '@/lib/auth-middleware';

/**
 * GET /api/v1/pricing
 * Get all pricing rules for the organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    await dbConnection.connect();

    const pricingRules = await PricingRule.find({ orgId: session.orgId }).sort({ priority: -1, createdAt: -1 });

    logger.info('Fetched pricing rules', {
      orgId: session.orgId,
      count: pricingRules.length,
    });

    return createSuccessResponse({ pricingRules });
  } catch (error) {
    logger.error('Error fetching pricing rules', { error });
    return handleApiError(error);
  }
}

/**
 * POST /api/v1/pricing
 * Create a new pricing rule
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    await dbConnection.connect();

    const body = await request.json();
    const {
      name,
      description,
      type,
      value,
      priority,
      isActive,
      applicableCountries,
      applicableRegions,
      excludedCountries,
      minTransactionAmount,
      maxTransactionAmount,
    } = body;

    // Validation
    if (!name || !name.trim()) {
      return createErrorResponse('Pricing rule name is required', 400);
    }

    if (!type || !['percentage', 'fixed'].includes(type)) {
      return createErrorResponse('Invalid pricing type. Must be percentage or fixed', 400);
    }

    if (value === undefined || value === null || value < 0) {
      return createErrorResponse('Pricing value must be a positive number', 400);
    }

    // Create pricing rule
    const pricingRule = await PricingRule.create({
      orgId: session.orgId,
      name: name.trim(),
      description: description?.trim() || '',
      type,
      value,
      priority: priority !== undefined ? priority : 0,
      isActive: isActive !== undefined ? isActive : true,
      applicableCountries: applicableCountries || [],
      applicableRegions: applicableRegions || [],
      excludedCountries: excludedCountries || [],
      minTransactionAmount: minTransactionAmount || null,
      maxTransactionAmount: maxTransactionAmount || null,
    });

    logger.info('Created pricing rule', {
      orgId: session.orgId,
      pricingRuleId: pricingRule._id,
      name: pricingRule.name,
    });

    return createSuccessResponse({ pricingRule }, 201);
  } catch (error) {
    logger.error('Error creating pricing rule', { error });
    return handleApiError(error);
  }
}
