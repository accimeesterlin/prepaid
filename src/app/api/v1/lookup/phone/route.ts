import { NextRequest } from 'next/server';
import { dbConnection } from '@pg-prepaid/db/connection';
import { Integration, StorefrontSettings, Org, Organization } from '@pg-prepaid/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { createDingConnectService, DingConnectProduct, DingConnectProvider } from '@/lib/services/dingconnect.service';
import { parsePhoneNumber } from 'awesome-phonenumber';
import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';
import type {
  PhoneLookupRequest,
  PhoneLookupResponse,
  ProductInfo,
  OperatorInfo,
} from '@/types/phone-lookup';

// Register English locale for country names
countries.registerLocale(en);

// Helper to get country name from ISO code
function getCountryName(countryCode: string): string {
  return countries.getName(countryCode, 'en') || countryCode;
}

/**
 * POST /api/v1/lookup/phone
 * Lookup phone number to detect country and operator
 * Public endpoint - no auth required
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnection.connect();

    const body: PhoneLookupRequest = await request.json();
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
      // Parse phone number using awesome-phonenumber for accurate country detection
      const parsedPhone = parsePhoneNumber(phoneNumber);

      if (!parsedPhone.valid) {
        return createErrorResponse(
          'Invalid phone number. Please enter a valid international phone number (e.g., +1234567890).',
          400
        );
      }

      const detectedCountry = parsedPhone.regionCode || '';
      // E.164 format includes + sign (e.g., +50934748112)
      const e164Phone = parsedPhone.number?.e164 || phoneNumber;
      // DingConnect API expects phone without + sign (e.g., 50934748112)
      const cleanPhone = e164Phone.replace(/^\+/, '');
      const countryName = getCountryName(detectedCountry);

      if (!detectedCountry) {
        return createErrorResponse(
          'Unable to detect country from phone number. Please include country code (e.g., +1 for US).',
          400
        );
      }

      logger.info('Phone number parsed successfully', {
        detectedCountry,
        countryName,
        phoneType: parsedPhone.typeIsMobile ? 'mobile' : parsedPhone.typeIsFixedLine ? 'fixed' : 'unknown',
      });

      // Check if country is enabled in storefront settings
      if (!storefrontSettings.isCountryEnabled(detectedCountry)) {
        return createErrorResponse(
          `Top-ups are not available for ${countryName}. Please contact support if you believe this is an error.`,
          400
        );
      }

      // Fetch providers and products with phone number for automatic detection
      logger.info('Fetching providers and products from DingConnect', {
        countryIso: detectedCountry,
        accountNumber: cleanPhone.substring(0, 5) + '***',
      });

      let providers;
      let products;

      try {
        // Fetch providers and products in parallel with accountNumber for detection
        [providers, products] = await Promise.all([
          dingService.getProviders({
            countryIso: detectedCountry,
            accountNumber: cleanPhone,
          }),
          dingService.getProducts({
            countryIso: detectedCountry,
            accountNumber: cleanPhone,
          }),
        ]);

        if (!providers || providers.length === 0) {
          logger.warn('No operators detected from phone number', {
            countryIso: detectedCountry,
            accountNumber: cleanPhone.substring(0, 5) + '***',
          });
          return createErrorResponse(
            'Unable to detect operator for this phone number. Please verify the number is correct.',
            404
          );
        }

        logger.info('Providers and products fetched successfully', {
          providers: providers.map(p => p.ProviderCode).join(', '),
          productsCount: products.length,
        });
      } catch (error: any) {
        logger.error('DingConnect lookup failed', {
          error: error.message,
          countryIso: detectedCountry,
          accountNumber: cleanPhone.substring(0, 5) + '***',
        });
        throw new Error(`Failed to lookup phone number: ${error.message}`);
      }

      // Apply pricing from storefront settings
      logger.info('Applying pricing to products', { productsCount: products.length });
      let productsWithPricing: ProductInfo[];
      try {
        productsWithPricing = products.map((product) => {
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
              benefitType: benefitType as 'airtime' | 'data' | 'voice' | 'sms' | 'bundle',
              benefitAmount,
              benefitUnit,
              pricing,
              // Include min/max for variable-value products
              isVariableValue: !!(product.Minimum && product.Maximum),
              minAmount: product.Minimum?.SendValue,
              maxAmount: product.Maximum?.SendValue,
              // Include product classification fields
              benefits: product.Benefits,
              validityPeriod: product.ValidityPeriodIso,
            } as ProductInfo;
          });
      } catch (error: any) {
        logger.error('Error applying pricing to products', { error: error.message, stack: error.stack });
        throw new Error(`Failed to calculate product pricing: ${error.message}`);
      }

      logger.info('Pricing applied successfully', { productsWithPricingCount: productsWithPricing.length });

      // All providers are detected operators
      const detectedOperators = providers;

      // Limit to reasonable number for performance
      const MAX_PRODUCTS_PER_REQUEST = 100;
      const limitedProducts = productsWithPricing.slice(0, MAX_PRODUCTS_PER_REQUEST);

      logger.info('Phone lookup successful', {
        orgSlug,
        orgId,
        phoneNumber: cleanPhone.substring(0, 5) + '***',
        detectedCountry,
        detectedOperators: providers.map(p => p.ProviderCode).join(', '),
        providersCount: providers.length,
        productsReturned: limitedProducts.length,
        totalProducts: productsWithPricing.length,
      });

      return createSuccessResponse({
        phoneNumber: cleanPhone,
        country: {
          code: detectedCountry,
          name: countryName || detectedCountry,
        },
        detectedOperators: detectedOperators.map((p) => ({
          code: p.ProviderCode,
          name: p.ProviderName || p.ProviderCode, // Fallback to code if name is empty
          logo: p.LogoUrl,
        })),
        operators: providers.map((p) => ({
          code: p.ProviderCode,
          name: p.ProviderName || p.ProviderCode, // Fallback to code if name is empty
          logo: p.LogoUrl,
        })),
        products: limitedProducts,
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
