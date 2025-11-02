import { NextRequest } from 'next/server';
import { dbConnection } from '@pg-prepaid/db/connection';
import { Integration, StorefrontSettings, Org, Organization, Discount, PricingRule } from '@pg-prepaid/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { createDingConnectService } from '@/lib/services/dingconnect.service';
import { parsePhoneNumber } from 'awesome-phonenumber';
import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';
import type {
  PhoneLookupRequest,
  ProductInfo,
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

    // Check if at least one product type is enabled
    const plansEnabled = storefrontSettings.productTypes?.plansEnabled ?? true;
    const topupsEnabled = storefrontSettings.productTypes?.topupsEnabled ?? true;

    if (!plansEnabled && !topupsEnabled) {
      logger.error('No product types enabled', { orgId });
      return createErrorResponse('No products are currently available. Please contact the merchant.', 400);
    }

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

    // Check balance threshold if enabled
    if (storefrontSettings.balanceThreshold?.enabled) {
      try {
        const balanceData = await dingService.getBalance();
        const currentBalance = balanceData.AccountBalance || 0;
        const minimumBalance = storefrontSettings.balanceThreshold.minimumBalance || 0;

        logger.info('Balance check', {
          currentBalance,
          minimumBalance,
          currency: balanceData.CurrencyCode,
        });

        if (currentBalance < minimumBalance) {
          logger.error('Balance below threshold', {
            orgId,
            currentBalance,
            minimumBalance,
          });
          return createErrorResponse(
            'Service temporarily unavailable due to low balance. Please try again later or contact support.',
            503
          );
        }
      } catch (balanceError: any) {
        logger.error('Failed to check balance', {
          error: balanceError.message,
          orgId,
        });
        // Don't block the request if balance check fails, just log the error
        // This prevents false negatives if the API is temporarily unavailable
      }
    }

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

      // Fetch active pricing rules for this organization
      const pricingRules = await PricingRule.find({
        orgId,
        isActive: true,
      }).sort({ priority: -1 }); // Sort by priority descending (highest first)

      logger.info('Fetched pricing rules', {
        rulesCount: pricingRules.length,
        priorities: pricingRules.map(r => `${r.name}:${r.priority}`).join(', '),
      });

      // Find the best applicable pricing rule for this country
      let applicablePricingRule = null;
      for (const rule of pricingRules) {
        if (rule.isApplicableToCountry(detectedCountry)) {
          applicablePricingRule = rule;
          break; // Already sorted by priority, so first match is best
        }
      }

      logger.info('Applicable pricing rule', {
        ruleName: applicablePricingRule?.name || 'None (using StorefrontSettings)',
        ruleType: applicablePricingRule?.type,
        ruleValue: applicablePricingRule?.value,
      });

      // Apply pricing from storefront settings or pricing rules
      logger.info('Applying pricing to products', { productsCount: products.length });
      let productsWithPricing: ProductInfo[];
      try {
        // First, filter products based on enabled product types
        const filteredProducts = products.filter((product) => {
          // Determine product type
          const hasMinMax = !!(product.Minimum && product.Maximum);
          const hasFixedPrice = !!(product.Price && product.Price.Amount);
          const hasSpecificBenefits = product.BenefitTypes &&
            (product.BenefitTypes.Data || product.BenefitTypes.Voice || product.BenefitTypes.SMS);
          const hasValidityPeriod = !!product.ValidityPeriodIso;
          const benefitsIndicatePlan = product.Benefits && Array.isArray(product.Benefits) &&
            (product.Benefits.includes('Data') || product.Benefits.includes('Voice') || product.Benefits.includes('SMS'));

          const isVariableValue = hasMinMax && !hasFixedPrice && !hasSpecificBenefits && !hasValidityPeriod && !benefitsIndicatePlan;

          // Filter based on settings
          if (isVariableValue && !topupsEnabled) {
            return false; // Skip variable top-ups if disabled
          }
          if (!isVariableValue && !plansEnabled) {
            return false; // Skip plans if disabled
          }
          return true;
        });

        logger.info('Products filtered by type', {
          originalCount: products.length,
          filteredCount: filteredProducts.length,
          plansEnabled,
          topupsEnabled,
        });

        productsWithPricing = filteredProducts.map((product) => {
            // Determine the cost price based on available format
            let costPrice = 0;
            let benefitAmount = 0;
            let benefitUnit = '';
            let benefitType = 'airtime';

            // Determine if this is a variable-value product (top-up with custom amount)
            // Variable-value products have:
            // - Minimum and Maximum values
            // - NO fixed Price (uses range pricing)
            // - NO specific benefits (Data/Voice/SMS)
            // - NO validity period (instant top-up, not a plan)
            const hasMinMax = !!(product.Minimum && product.Maximum);
            const hasFixedPrice = !!(product.Price && product.Price.Amount);
            const hasSpecificBenefits = product.BenefitTypes &&
              (product.BenefitTypes.Data || product.BenefitTypes.Voice || product.BenefitTypes.SMS);
            const hasValidityPeriod = !!product.ValidityPeriodIso;

            // Check if Benefits array indicates this is a plan
            const benefitsIndicatePlan = product.Benefits && Array.isArray(product.Benefits) &&
              (product.Benefits.includes('Data') || product.Benefits.includes('Voice') || product.Benefits.includes('SMS'));

            // Variable-value: Has min/max BUT no fixed price, no specific benefits, and no validity period
            // Fixed-value (plans): Has fixed price OR has specific benefit amounts OR has validity period OR benefits indicate plan
            const isVariableValue = hasMinMax && !hasFixedPrice && !hasSpecificBenefits && !hasValidityPeriod && !benefitsIndicatePlan;

            // Old format: Price.Amount (always fixed-value products/plans)
            if (product.Price && product.Price.Amount) {
              costPrice = product.Price.Amount;
              benefitAmount = product.BenefitTypes?.Airtime?.Amount || product.BenefitTypes?.Data?.Amount || 0;
              benefitUnit = product.BenefitTypes?.Airtime?.CurrencyCode || product.BenefitTypes?.Data?.Unit || '';
              benefitType = product.BenefitTypes?.Airtime ? 'airtime' : 'data';
            }
            // New format: Minimum.SendValue (could be variable or fixed)
            else if (product.Minimum && product.Minimum.SendValue) {
              // For fixed plans with min/max, use minimum as the price
              costPrice = isVariableValue ? product.Minimum.SendValue : product.Minimum.SendValue;
              benefitAmount = product.Minimum.ReceiveValue || costPrice;
              benefitUnit = product.Minimum.ReceiveCurrencyIso || product.Minimum.SendCurrencyIso || 'USD';
              // Determine benefit type from Benefits array
              if (product.Benefits && Array.isArray(product.Benefits)) {
                benefitType = product.Benefits.includes('Data') ? 'data' : 'airtime';
              }
            }

            // Calculate pricing using PricingRule (no fallback to legacy StorefrontSettings)
            let pricing;
            if (applicablePricingRule) {
              // Use PricingRule to calculate markup
              const markup = applicablePricingRule.calculateMarkup(costPrice);
              const priceAfterMarkup = costPrice + markup;

              // Manually apply discount from StorefrontSettings (without applying markup again)
              let finalPrice = priceAfterMarkup;
              let discountAmount = 0;
              let discountApplied = false;

              if (storefrontSettings.discount.enabled) {
                const now = new Date();
                const isDateValid =
                  (!storefrontSettings.discount.startDate || storefrontSettings.discount.startDate <= now) &&
                  (!storefrontSettings.discount.endDate || storefrontSettings.discount.endDate >= now);

                const isCountryValid =
                  !storefrontSettings.discount.applicableCountries ||
                  storefrontSettings.discount.applicableCountries.length === 0 ||
                  storefrontSettings.discount.applicableCountries.includes(detectedCountry);

                const isAmountValid =
                  !storefrontSettings.discount.minPurchaseAmount ||
                  priceAfterMarkup >= storefrontSettings.discount.minPurchaseAmount;

                if (isDateValid && isCountryValid && isAmountValid) {
                  if (storefrontSettings.discount.type === 'percentage') {
                    discountAmount = priceAfterMarkup * (storefrontSettings.discount.value / 100);
                  } else {
                    discountAmount = storefrontSettings.discount.value;
                  }
                  finalPrice = Math.max(0, priceAfterMarkup - discountAmount);
                  discountApplied = true;
                }
              }

              pricing = {
                costPrice,
                markup: Math.round(markup * 100) / 100,
                priceBeforeDiscount: Math.round(priceAfterMarkup * 100) / 100,
                discount: Math.round(discountAmount * 100) / 100,
                finalPrice: Math.round(finalPrice * 100) / 100,
                discountApplied,
              };
            } else {
              // No pricing rule found - use cost price as final price (0% markup)
              pricing = {
                costPrice,
                markup: 0,
                priceBeforeDiscount: costPrice,
                discount: 0,
                finalPrice: costPrice,
                discountApplied: false,
              };
            }

            return {
              skuCode: product.SkuCode,
              name: product.DefaultDisplayText,
              providerCode: product.ProviderCode,
              providerName: providers.find((p) => p.ProviderCode === product.ProviderCode)?.ProviderName || product.ProviderCode,
              benefitType: benefitType as 'airtime' | 'data' | 'voice' | 'sms' | 'bundle',
              benefitAmount,
              benefitUnit,
              pricing,
              // Only set as variable-value if it's truly a custom-amount top-up
              isVariableValue,
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

      // Fetch active discounts from Discount collection
      const activeDiscounts = await Discount.find({
        orgId,
        isActive: true,
      }).sort({ value: -1 }); // Sort by value descending to get best discount first

      // Filter valid discounts (check date ranges, usage limits, etc.)
      const validDiscounts = activeDiscounts.filter(discount => discount.isValid());

      // Find best applicable discount for this country
      let bestDiscount = null;
      for (const discount of validDiscounts) {
        if (
          !discount.applicableCountries ||
          discount.applicableCountries.length === 0 ||
          discount.applicableCountries.includes(detectedCountry)
        ) {
          bestDiscount = discount;
          break; // Already sorted by value, so first match is best
        }
      }

      logger.info('Phone lookup successful', {
        orgSlug,
        orgId,
        phoneNumber: cleanPhone.substring(0, 5) + '***',
        detectedCountry,
        detectedOperators: providers.map(p => p.ProviderCode).join(', '),
        providersCount: providers.length,
        productsReturned: limitedProducts.length,
        totalProducts: productsWithPricing.length,
        activeDiscountsCount: validDiscounts.length,
        bestDiscountName: bestDiscount?.name,
      });

      // Get organization name for branding fallback
      const organizationName = organization?.name || org?.name || '';

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
        branding: {
          ...storefrontSettings.branding,
          // Use businessName from settings, fallback to organization name
          businessName: storefrontSettings.branding?.businessName || organizationName,
        },
        discount: bestDiscount ? {
          id: bestDiscount._id,
          name: bestDiscount.name,
          description: bestDiscount.description,
          type: bestDiscount.type,
          value: bestDiscount.value,
          minPurchaseAmount: bestDiscount.minPurchaseAmount,
          maxDiscountAmount: bestDiscount.maxDiscountAmount,
        } : (storefrontSettings.discount.enabled ? {
          description: storefrontSettings.discount.description,
          type: storefrontSettings.discount.type,
          value: storefrontSettings.discount.value,
        } : null),
        testMode: storefrontSettings.topupSettings?.validateOnly || false,
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
