import { NextRequest } from 'next/server';
import { dbConnection } from '@pg-prepaid/db/connection';
import { Discount } from '@pg-prepaid/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { verifyAuthMiddleware } from '@/lib/auth-middleware';

/**
 * GET /api/v1/discounts
 * Get all discounts for the organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuthMiddleware(request);
    if (!session) {
      return createErrorResponse('Unauthorized', 401);
    }

    await dbConnection.connect();

    const discounts = await Discount.find({ orgId: session.orgId }).sort({ createdAt: -1 });

    logger.info('Fetched discounts', {
      orgId: session.orgId,
      count: discounts.length,
    });

    return createSuccessResponse({ discounts });
  } catch (error) {
    logger.error('Error fetching discounts', { error });
    return handleApiError(error);
  }
}

/**
 * POST /api/v1/discounts
 * Create a new discount
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuthMiddleware(request);
    if (!session) {
      return createErrorResponse('Unauthorized', 401);
    }

    await dbConnection.connect();

    const body = await request.json();
    const {
      name,
      description,
      type,
      value,
      isActive,
      startDate,
      endDate,
      minPurchaseAmount,
      maxDiscountAmount,
      applicableCountries,
      usageLimit,
    } = body;

    // Validation
    if (!name || !name.trim()) {
      return createErrorResponse('Discount name is required', 400);
    }

    if (!description || !description.trim()) {
      return createErrorResponse('Discount description is required', 400);
    }

    if (!type || !['percentage', 'fixed'].includes(type)) {
      return createErrorResponse('Invalid discount type. Must be percentage or fixed', 400);
    }

    if (value === undefined || value === null || value < 0) {
      return createErrorResponse('Discount value must be a positive number', 400);
    }

    if (type === 'percentage' && value > 100) {
      return createErrorResponse('Percentage discount cannot exceed 100%', 400);
    }

    // Create discount
    const discount = await Discount.create({
      orgId: session.orgId,
      name: name.trim(),
      description: description.trim(),
      type,
      value,
      isActive: isActive !== undefined ? isActive : true,
      startDate: startDate || null,
      endDate: endDate || null,
      minPurchaseAmount: minPurchaseAmount || null,
      maxDiscountAmount: maxDiscountAmount || null,
      applicableCountries: applicableCountries || [],
      usageLimit: usageLimit || null,
      usageCount: 0,
    });

    logger.info('Created discount', {
      orgId: session.orgId,
      discountId: discount._id,
      name: discount.name,
    });

    return createSuccessResponse({ discount }, 201);
  } catch (error) {
    logger.error('Error creating discount', { error });
    return handleApiError(error);
  }
}
