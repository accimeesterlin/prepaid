import { NextRequest } from 'next/server';
import { dbConnection } from '@pg-prepaid/db/connection';
import { Integration, StorefrontSettings, Org, Organization } from '@pg-prepaid/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { createDingConnectService } from '@/lib/services/dingconnect.service';

/**
 * POST /api/v1/lookup/phone
 * Lookup phone number to detect country and operator
 * Public endpoint - no auth required
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnection.connect();

    const body = await request.json();
    const { phoneNumber, orgSlug } = body;

    logger.info('Phone lookup request', { phoneNumber: phoneNumber?.substring(0, 5) + '***', orgSlug });

    if (!phoneNumber) {
      return createErrorResponse('Phone number is required', 400);
    }

    if (!orgSlug) {
      return createErrorResponse('Organization slug is required', 400);
    }

    // Look up organization by slug
    logger.info('Looking up organization by slug', { orgSlug });
    const org = await Org.findOne({ slug: orgSlug });
    const organization = await Organization.findOne({ slug: orgSlug });

    const orgId = org?._id?.toString() || organization?._id?.toString();

    if (!orgId) {
      logger.error('Organization not found', { orgSlug });
      return createErrorResponse(`Organization not found. Please check the storefront URL.`, 404);
    }

    logger.info('Organization found', { orgId, orgSlug });

    // Get organization's storefront settings
    const storefrontSettings = await StorefrontSettings.findOne({ orgId });

    if (!storefrontSettings) {
      logger.error('Storefront settings not found', { orgId });
      return createErrorResponse('Storefront not configured. Please contact the merchant.', 400);
    }

    if (!storefrontSettings.isActive) {
      logger.error('Storefront not active', { orgId });
      return createErrorResponse('Storefront is temporarily unavailable. Please try again later.', 400);
    }

    logger.info('Storefront settings found', { orgId, isActive: storefrontSettings.isActive });

    // Get active DingConnect integration for this org
    const integration = await Integration.findOne({
      orgId,
      provider: 'dingconnect',
      status: 'active',
    }).select('+credentials.apiKey');

    if (!integration) {
      logger.error('DingConnect integration not found', { orgId });
      return createErrorResponse('Service integration not configured. Please contact the merchant.', 500);
    }

    if (!integration.credentials || !integration.credentials.apiKey) {
      logger.error('DingConnect API key not found', { orgId });
      return createErrorResponse('Service credentials not configured. Please contact the merchant.', 500);
    }

    logger.info('Integration found', { orgId, provider: integration.provider });

    // Use DingConnect API to lookup phone number
    const dingService = createDingConnectService(integration.credentials as any);

    try {
      // DingConnect doesn't have a direct phone lookup endpoint,
      // but we can use their GetProducts endpoint with phone number detection
      // For now, we'll use a simple country code detection from the phone number

      // Extract country code from phone number (basic implementation)
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      let countryCode = '';
      let detectedCountry = '';

      // Common country code patterns
      const countryPatterns: { [key: string]: { code: string; name: string; minLength: number } } = {
        '1': { code: 'US', name: 'United States', minLength: 11 },
        '44': { code: 'GB', name: 'United Kingdom', minLength: 10 },
        '675': { code: 'PG', name: 'Papua New Guinea', minLength: 11 },
        '509': { code: 'HT', name: 'Haiti', minLength: 11 },
        '1876': { code: 'JM', name: 'Jamaica (1876)', minLength: 11 },
        '1658': { code: 'JM', name: 'Jamaica (1658)', minLength: 11 },
        '93': { code: 'AF', name: 'Afghanistan', minLength: 11 },
        '52': { code: 'MX', name: 'Mexico', minLength: 12 },
        '91': { code: 'IN', name: 'India', minLength: 12 },
        '63': { code: 'PH', name: 'Philippines', minLength: 12 },
        '234': { code: 'NG', name: 'Nigeria', minLength: 13 },
      };

      // Try to match country code (longest first)
      const sortedPatterns = Object.entries(countryPatterns).sort(
        (a, b) => b[0].length - a[0].length
      );

      for (const [code, info] of sortedPatterns) {
        if (cleanPhone.startsWith(code)) {
          countryCode = code;
          detectedCountry = info.code;
          break;
        }
      }

      if (!detectedCountry) {
        return createErrorResponse(
          'Unable to detect country from phone number. Please check the number format.',
          400
        );
      }

      // Check if country is enabled in storefront settings
      if (!storefrontSettings.isCountryEnabled(detectedCountry)) {
        return createErrorResponse(
          `Top-ups are not available for ${countryPatterns[countryCode]?.name || detectedCountry}`,
          400
        );
      }

      // Try to detect the specific operator for this phone number
      logger.info('Attempting operator detection', { phoneNumber: cleanPhone, countryIso: detectedCountry });
      let detectedProvider = null;
      try {
        const accountLookup = await dingService.lookupAccount({
          accountNumber: cleanPhone,
          countryIso: detectedCountry,
        });
        detectedProvider = accountLookup.ProviderCode;
        logger.info('Operator detected successfully', {
          providerCode: detectedProvider,
          providerName: accountLookup.ProviderName,
        });
      } catch (error: any) {
        logger.warn('Operator detection failed, will show all operators', { error: error.message });
        // Continue without operator detection - we'll show all products
      }

      // Get available operators/providers for this country
      logger.info('Fetching providers from DingConnect', { countryIso: detectedCountry });
      let providers;
      try {
        providers = await dingService.getProviders({
          countryIso: detectedCountry,
        });
      } catch (error: any) {
        logger.error('DingConnect getProviders failed', { error: error.message, countryIso: detectedCountry });
        throw new Error(`Failed to fetch providers: ${error.message}`);
      }

      if (!providers || providers.length === 0) {
        logger.warn('No providers found for country', { countryIso: detectedCountry });
        return createErrorResponse(
          'No operators available for this country at the moment',
          404
        );
      }

      logger.info('Providers fetched successfully', { count: providers.length, detectedProvider });

      // Get products for the first/main provider (or all providers)
      logger.info('Fetching products from DingConnect', { countryIso: detectedCountry });
      let products;
      try {
        products = await dingService.getProducts({
          countryIso: detectedCountry,
        });
      } catch (error: any) {
        logger.error('DingConnect getProducts failed', { error: error.message, countryIso: detectedCountry });
        throw new Error(`Failed to fetch products: ${error.message}`);
      }

      logger.info('Products fetched successfully', { count: products.length });

      // Apply pricing from storefront settings
      logger.info('Applying pricing to products', { productsCount: products.length });
      let productsWithPricing;
      try {
        productsWithPricing = products
          .filter((product) => {
            // Filter by detected country - DingConnect returns all products regardless of countryIso param
            const isCorrectCountry = product.CountryIso === detectedCountry || product.RegionCode === detectedCountry;
            if (!isCorrectCountry) {
              return false;
            }

            // Filter out products without proper pricing structure
            // Support both old format (Price.Amount) and new format (Minimum/Maximum)
            const hasOldFormat = product.Price && product.Price.Amount;
            const hasNewFormat = product.Minimum && product.Minimum.SendValue;
            return hasOldFormat || hasNewFormat;
          })
          .map((product) => {
            // Determine the cost price based on available format
            let costPrice = 0;
            let benefitAmount = 0;
            let benefitUnit = '';
            let benefitType = 'airtime';

            // Old format: Price.Amount
            if (product.Price && product.Price.Amount) {
              costPrice = product.Price.Amount;
              benefitAmount = product.BenefitTypes?.Airtime?.Amount || product.BenefitTypes?.Data?.Amount || 0;
              benefitUnit = product.BenefitTypes?.Airtime?.CurrencyCode || product.BenefitTypes?.Data?.Unit || '';
              benefitType = product.BenefitTypes?.Airtime ? 'airtime' : 'data';
            }
            // New format: Minimum.SendValue
            else if (product.Minimum && product.Minimum.SendValue) {
              costPrice = product.Minimum.SendValue;
              benefitAmount = product.Minimum.ReceiveValue || costPrice;
              benefitUnit = product.Minimum.ReceiveCurrencyIso || product.Minimum.SendCurrencyIso || 'USD';
              // Determine benefit type from Benefits array
              if (product.Benefits && Array.isArray(product.Benefits)) {
                benefitType = product.Benefits.includes('Data') ? 'data' : 'airtime';
              }
            }

            const pricing = storefrontSettings.calculateFinalPrice(
              costPrice,
              detectedCountry
            );

            return {
              skuCode: product.SkuCode,
              name: product.DefaultDisplayText,
              providerCode: product.ProviderCode,
              providerName: providers.find((p) => p.ProviderCode === product.ProviderCode)?.ProviderName || product.ProviderCode,
              benefitType,
              benefitAmount,
              benefitUnit,
              pricing,
              // Include min/max for variable-value products
              isVariableValue: !!(product.Minimum && product.Maximum),
              minAmount: product.Minimum?.SendValue,
              maxAmount: product.Maximum?.SendValue,
            };
          });
      } catch (error: any) {
        logger.error('Error applying pricing to products', { error: error.message, stack: error.stack });
        throw new Error(`Failed to calculate product pricing: ${error.message}`);
      }

      logger.info('Pricing applied successfully', { productsWithPricingCount: productsWithPricing.length });

      // If operator was detected, filter and prioritize those products
      let filteredProducts = productsWithPricing;
      const detectedOperator = detectedProvider ? providers.find(p => p.ProviderCode === detectedProvider) : null;

      if (detectedProvider) {
        // Separate detected provider products from others
        const detectedProviderProducts = productsWithPricing.filter(
          p => p.providerCode === detectedProvider
        );
        const otherProducts = productsWithPricing.filter(
          p => p.providerCode !== detectedProvider
        );

        // Prioritize detected provider products, limit others
        filteredProducts = [
          ...detectedProviderProducts,
          ...otherProducts.slice(0, 20), // Show only first 20 from other providers
        ];

        logger.info('Products filtered by detected operator', {
          detectedProvider,
          detectedProviderProducts: detectedProviderProducts.length,
          otherProducts: otherProducts.length,
          totalFiltered: filteredProducts.length,
        });
      } else {
        // No operator detected, limit total products
        filteredProducts = productsWithPricing.slice(0, 50);
        logger.info('No operator detected, limiting to 50 products');
      }

      logger.info('Phone lookup successful', {
        orgSlug,
        orgId,
        phoneNumber: cleanPhone.substring(0, 5) + '***', // Log partial number for privacy
        detectedCountry,
        detectedProvider,
        providersCount: providers.length,
        productsCount: filteredProducts.length,
      });

      return createSuccessResponse({
        phoneNumber: cleanPhone,
        country: {
          code: detectedCountry,
          name: countryPatterns[countryCode]?.name || detectedCountry,
        },
        detectedOperator: detectedOperator ? {
          code: detectedOperator.ProviderCode,
          name: detectedOperator.ProviderName,
          logo: detectedOperator.LogoUrl,
        } : null,
        operators: providers.map((p) => ({
          code: p.ProviderCode,
          name: p.ProviderName,
          logo: p.LogoUrl,
        })),
        products: filteredProducts,
        totalProducts: productsWithPricing.length,
        branding: storefrontSettings.branding,
        discount: storefrontSettings.discount.enabled ? {
          description: storefrontSettings.discount.description,
          type: storefrontSettings.discount.type,
          value: storefrontSettings.discount.value,
        } : null,
      });
    } catch (error: any) {
      logger.error('Error looking up phone number with DingConnect', {
        error: error.message,
        stack: error.stack,
        phoneNumber: phoneNumber?.substring(0, 5) + '***'
      });
      return createErrorResponse(
        `Failed to lookup phone number: ${error.message}`,
        500
      );
    }
  } catch (error: any) {
    logger.error('Error in phone lookup (outer catch)', {
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    return handleApiError(error);
  }
}
