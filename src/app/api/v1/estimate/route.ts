import { NextRequest } from 'next/server';
import { dbConnection } from '@pg-prepaid/db/connection';
import { Integration, Org, Organization, PricingRule } from '@pg-prepaid/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { createDingConnectService } from '@/lib/services/dingconnect.service';
import { parsePhoneNumber } from 'awesome-phonenumber';

interface EstimateRequest {
  orgSlug: string;
  skuCode: string;
  sendValue: number; // This is the CUSTOMER-FACING price (includes markup)
  sendCurrencyIso?: string;
  phoneNumber?: string; // Optional: to detect country for pricing rule
}

/**
 * POST /api/v1/estimate
 * Estimate prices for a product with custom amount
 * Public endpoint - no auth required
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnection.connect();

    const body: EstimateRequest = await request.json();
    const { orgSlug, skuCode, sendValue, sendCurrencyIso = 'USD' } = body;

    logger.info('Price estimate request', { orgSlug, skuCode, sendValue });

    if (!orgSlug) {
      return createErrorResponse('Organization slug is required', 400);
    }

    if (!skuCode) {
      return createErrorResponse('Product SKU code is required', 400);
    }

    if (!sendValue || sendValue <= 0) {
      return createErrorResponse('Send value must be greater than 0', 400);
    }

    // Look up organization by slug
    const org = await Org.findOne({ slug: orgSlug });
    const organization = await Organization.findOne({ slug: orgSlug });
    const orgId = org?._id?.toString() || organization?._id?.toString();

    if (!orgId) {
      logger.error('Organization not found', { orgSlug });
      return createErrorResponse('Organization not found', 404);
    }

    // Get active DingConnect integration
    const integration = await Integration.findOne({
      orgId,
      provider: 'dingconnect',
      status: 'active',
    }).select('+credentials.apiKey');

    if (!integration || !integration.credentials?.apiKey) {
      logger.error('DingConnect integration not found', { orgId });
      return createErrorResponse('Service integration not configured', 500);
    }

    // Fetch active pricing rules to determine markup
    const pricingRules = await PricingRule.find({
      orgId,
      isActive: true,
    }).sort({ priority: -1 }); // Sort by priority descending (highest first)

    // Detect country from phone number if provided (optional)
    let detectedCountry: string | null = null;
    if (body.phoneNumber) {
      try {
        const parsedPhone = parsePhoneNumber(body.phoneNumber);
        if (parsedPhone.valid) {
          detectedCountry = parsedPhone.regionCode || null;
        }
      } catch (error) {
        // If phone parsing fails, continue without country detection
        logger.warn('Failed to parse phone number for country detection', { phoneNumber: body.phoneNumber });
      }
    }

    // Find applicable pricing rule (fallback to first active rule if no country-specific match)
    let applicablePricingRule = null;
    if (detectedCountry) {
      for (const rule of pricingRules) {
        if (rule.isApplicableToCountry(detectedCountry)) {
          applicablePricingRule = rule;
          break; // First match is best (sorted by priority)
        }
      }
    }

    // Fallback to first active pricing rule if no country-specific rule found
    if (!applicablePricingRule && pricingRules.length > 0) {
      applicablePricingRule = pricingRules[0];
    }

    logger.info('Pricing rule for estimate', {
      ruleName: applicablePricingRule?.name || 'None',
      detectedCountry,
      percentageMarkup: applicablePricingRule?.percentageMarkup,
      fixedMarkup: applicablePricingRule?.fixedMarkup,
    });

    // Convert customer-facing price to cost price (reverse markup calculation)
    // Customer price = costPrice + markup
    // If markup is (costPrice * percentage) + fixed:
    //   customerPrice = costPrice + (costPrice * percentage) + fixed
    //   customerPrice = costPrice * (1 + percentage) + fixed
    //   costPrice = (customerPrice - fixed) / (1 + percentage)
    let costPrice = sendValue; // Default to sendValue if no markup
    if (applicablePricingRule) {
      const percentageMarkup = applicablePricingRule.percentageMarkup || 0;
      const fixedMarkup = applicablePricingRule.fixedMarkup || 0;

      // Reverse the markup calculation
      costPrice = (sendValue - fixedMarkup) / (1 + percentageMarkup / 100);

      logger.info('Converted customer price to cost price', {
        customerPrice: sendValue,
        costPrice,
        percentageMarkup,
        fixedMarkup,
        savings: sendValue - costPrice,
      });
    }

    // Use DingConnect API to estimate prices with the COST PRICE (not customer price)
    const dingService = createDingConnectService(integration.credentials as any);

    try {
      logger.info('Calling DingConnect estimatePrices', {
        skuCode,
        customerPrice: sendValue,
        costPrice,
        sendCurrencyIso,
      });

      const estimates = await dingService.estimatePrices([
        {
          SkuCode: skuCode,
          SendValue: costPrice, // Send COST PRICE to DingConnect, not customer price
          SendCurrencyIso: sendCurrencyIso,
          ReceiveValue: 0,
          BatchItemRef: skuCode,
        },
      ]);

      logger.info('DingConnect raw response', { estimates: JSON.stringify(estimates) });

      if (!estimates || estimates.length === 0) {
        logger.error('No estimate returned from DingConnect', { skuCode, sendValue });
        return createErrorResponse('Failed to estimate price', 500);
      }

      const estimate = estimates[0];

      // DingConnect returns estimate data inside a Price object
      const priceData = estimate.Price || estimate;

      // Check if DingConnect returned zeros (invalid SKU or parameters)
      if (priceData.ReceiveValue === 0 && priceData.SendValue === 0) {
        logger.error('DingConnect returned zero values', {
          skuCode,
          sendValue,
          estimate: JSON.stringify(estimate),
        });
        return createErrorResponse(
          'Unable to estimate price for this product. The product may not support custom amounts.',
          400
        );
      }

      logger.info('Price estimate successful', {
        orgSlug,
        skuCode,
        sendValue: priceData.SendValue,
        receiveValue: priceData.ReceiveValue,
        receiveCurrency: priceData.ReceiveCurrencyIso,
        rawEstimate: JSON.stringify(estimate),
      });

      // Ensure numeric values are properly formatted
      const responseData = {
        skuCode: estimate.SkuCode,
        sendValue: Number(priceData.SendValue) || 0,
        sendCurrency: priceData.SendCurrencyIso || 'USD',
        receiveValue: Number(priceData.ReceiveValue) || 0,
        receiveCurrency: priceData.ReceiveCurrencyIso || '',
        fee: Number((priceData as any).CustomerFee || (priceData as any).DistributorFee || (priceData as any).Fee) || 0,
        taxRate: Number((priceData as any).TaxRate) || 0,
      };

      logger.info('Sending estimate response', { responseData: JSON.stringify(responseData) });

      return createSuccessResponse(responseData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DingConnect estimate failed', {
        error: errorMessage,
        skuCode,
        sendValue,
      });
      return createErrorResponse(`Failed to estimate price: ${errorMessage}`, 500);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('Error in price estimate', {
      error: errorMessage,
      stack: errorStack,
    });
    return handleApiError(error);
  }
}
