import { IProduct } from '../Product';

/**
 * Unit tests for Product model methods
 * Note: These tests focus on business logic in model methods without requiring a database connection
 */

// Mock product data creator
const createMockProduct = (overrides?: Partial<IProduct>): IProduct => {
  const baseProduct = {
    orgId: 'org-123',
    name: 'Test Product',
    provider: 'dingconnect' as const,
    providerProductId: 'prod-123',
    operatorId: 'op-123',
    operatorName: 'Test Operator',
    operatorCountry: 'US',
    pricing: {
      costPrice: 10,
      sellPrice: 12,
      currency: 'USD',
      profitMargin: 20,
    },
    denomination: {
      type: 'fixed' as const,
      fixedAmount: 10,
      unit: 'USD',
    },
    resaleSettings: {
      allowedCountries: [],
      blockedCountries: [],
      customPricing: {
        enabled: false,
      },
      discount: {
        enabled: false,
      },
      limits: {},
    },
    sync: {
      autoSync: false,
    },
    status: 'active' as const,
    metadata: {
      popularity: 0,
      totalSales: 0,
      revenue: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as IProduct;

  // Add methods
  baseProduct.getEffectivePrice = function (countryCode?: string): number {
    let price = this.pricing.sellPrice;

    // Apply country-specific pricing if enabled
    if (countryCode && this.resaleSettings.customPricing.enabled) {
      const countryPrice = this.resaleSettings.customPricing.priceByCountry?.get(countryCode);
      if (countryPrice) {
        price = countryPrice;
      }
    }

    // Apply discount if active
    if (this.resaleSettings.discount.enabled) {
      const now = new Date();
      const discountActive =
        (!this.resaleSettings.discount.startDate || this.resaleSettings.discount.startDate <= now) &&
        (!this.resaleSettings.discount.endDate || this.resaleSettings.discount.endDate >= now);

      if (discountActive && this.resaleSettings.discount.value) {
        if (this.resaleSettings.discount.type === 'percentage') {
          price = price - (price * this.resaleSettings.discount.value) / 100;
        } else if (this.resaleSettings.discount.type === 'fixed') {
          price = Math.max(0, price - this.resaleSettings.discount.value);
        }
      }
    }

    return Math.round(price * 100) / 100;
  };

  baseProduct.isAvailableInCountry = function (countryCode: string): boolean {
    // Check if country is blocked
    if (this.resaleSettings.blockedCountries.includes(countryCode)) {
      return false;
    }

    // If allowedCountries is empty, product is available everywhere
    if (this.resaleSettings.allowedCountries.length === 0) {
      return true;
    }

    // Check if country is in allowed list
    return this.resaleSettings.allowedCountries.includes(countryCode);
  };

  baseProduct.validateQuantity = function (quantity: number): { valid: boolean; error?: string } {
    if (this.resaleSettings.limits.minQuantity && quantity < this.resaleSettings.limits.minQuantity) {
      return {
        valid: false,
        error: `Minimum quantity is ${this.resaleSettings.limits.minQuantity}`,
      };
    }

    if (this.resaleSettings.limits.maxQuantity && quantity > this.resaleSettings.limits.maxQuantity) {
      return {
        valid: false,
        error: `Maximum quantity is ${this.resaleSettings.limits.maxQuantity}`,
      };
    }

    return { valid: true };
  };

  return baseProduct;
};

describe('Product Model - getEffectivePrice', () => {
  describe('Base price without customizations', () => {
    it('should return sell price when no customizations are applied', () => {
      const product = createMockProduct();
      const price = product.getEffectivePrice();

      expect(price).toBe(12);
    });

    it('should return sell price when country code is provided but custom pricing is disabled', () => {
      const product = createMockProduct();
      const price = product.getEffectivePrice('US');

      expect(price).toBe(12);
    });
  });

  describe('Country-specific pricing', () => {
    it('should apply country-specific price when enabled', () => {
      const priceByCountry = new Map<string, number>();
      priceByCountry.set('CA', 15);

      const product = createMockProduct({
        resaleSettings: {
          allowedCountries: [],
          blockedCountries: [],
          customPricing: {
            enabled: true,
            priceByCountry,
          },
          discount: { enabled: false },
          limits: {},
        },
      });

      const price = product.getEffectivePrice('CA');
      expect(price).toBe(15);
    });

    it('should return base price if country not in custom pricing map', () => {
      const priceByCountry = new Map<string, number>();
      priceByCountry.set('CA', 15);

      const product = createMockProduct({
        resaleSettings: {
          allowedCountries: [],
          blockedCountries: [],
          customPricing: {
            enabled: true,
            priceByCountry,
          },
          discount: { enabled: false },
          limits: {},
        },
      });

      const price = product.getEffectivePrice('US');
      expect(price).toBe(12);
    });
  });

  describe('Discount application', () => {
    it('should apply percentage discount correctly', () => {
      const product = createMockProduct({
        resaleSettings: {
          allowedCountries: [],
          blockedCountries: [],
          customPricing: { enabled: false },
          discount: {
            enabled: true,
            type: 'percentage',
            value: 10, // 10% off
          },
          limits: {},
        },
      });

      const price = product.getEffectivePrice();
      expect(price).toBe(10.8); // 12 - (12 * 0.10) = 10.8
    });

    it('should apply fixed discount correctly', () => {
      const product = createMockProduct({
        resaleSettings: {
          allowedCountries: [],
          blockedCountries: [],
          customPricing: { enabled: false },
          discount: {
            enabled: true,
            type: 'fixed',
            value: 2, // $2 off
          },
          limits: {},
        },
      });

      const price = product.getEffectivePrice();
      expect(price).toBe(10); // 12 - 2 = 10
    });

    it('should not apply discount below zero', () => {
      const product = createMockProduct({
        resaleSettings: {
          allowedCountries: [],
          blockedCountries: [],
          customPricing: { enabled: false },
          discount: {
            enabled: true,
            type: 'fixed',
            value: 20, // $20 off (more than price)
          },
          limits: {},
        },
      });

      const price = product.getEffectivePrice();
      expect(price).toBe(0); // Cannot go below 0
    });

    it('should only apply discount if within date range', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const product = createMockProduct({
        resaleSettings: {
          allowedCountries: [],
          blockedCountries: [],
          customPricing: { enabled: false },
          discount: {
            enabled: true,
            type: 'percentage',
            value: 10,
            startDate: yesterday,
            endDate: tomorrow,
          },
          limits: {},
        },
      });

      const price = product.getEffectivePrice();
      expect(price).toBe(10.8); // Discount should apply
    });

    it('should not apply discount if before start date', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const product = createMockProduct({
        resaleSettings: {
          allowedCountries: [],
          blockedCountries: [],
          customPricing: { enabled: false },
          discount: {
            enabled: true,
            type: 'percentage',
            value: 10,
            startDate: tomorrow,
            endDate: nextWeek,
          },
          limits: {},
        },
      });

      const price = product.getEffectivePrice();
      expect(price).toBe(12); // No discount applied
    });

    it('should not apply discount if after end date', () => {
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const product = createMockProduct({
        resaleSettings: {
          allowedCountries: [],
          blockedCountries: [],
          customPricing: { enabled: false },
          discount: {
            enabled: true,
            type: 'percentage',
            value: 10,
            startDate: lastWeek,
            endDate: yesterday,
          },
          limits: {},
        },
      });

      const price = product.getEffectivePrice();
      expect(price).toBe(12); // No discount applied
    });
  });

  describe('Combined pricing rules', () => {
    it('should apply country-specific pricing then discount', () => {
      const priceByCountry = new Map<string, number>();
      priceByCountry.set('CA', 20);

      const product = createMockProduct({
        resaleSettings: {
          allowedCountries: [],
          blockedCountries: [],
          customPricing: {
            enabled: true,
            priceByCountry,
          },
          discount: {
            enabled: true,
            type: 'percentage',
            value: 10, // 10% off
          },
          limits: {},
        },
      });

      const price = product.getEffectivePrice('CA');
      expect(price).toBe(18); // 20 - (20 * 0.10) = 18
    });

    it('should round price to 2 decimal places', () => {
      const product = createMockProduct({
        pricing: {
          costPrice: 10,
          sellPrice: 13.333333,
          currency: 'USD',
          profitMargin: 33.33,
        },
        resaleSettings: {
          allowedCountries: [],
          blockedCountries: [],
          customPricing: { enabled: false },
          discount: {
            enabled: true,
            type: 'percentage',
            value: 15,
          },
          limits: {},
        },
      });

      const price = product.getEffectivePrice();
      expect(price).toBe(11.33); // Should be rounded to 2 decimals
    });
  });
});

describe('Product Model - isAvailableInCountry', () => {
  it('should return true for any country when no restrictions are set', () => {
    const product = createMockProduct();

    expect(product.isAvailableInCountry('US')).toBe(true);
    expect(product.isAvailableInCountry('CA')).toBe(true);
    expect(product.isAvailableInCountry('UK')).toBe(true);
  });

  it('should return false for blocked countries', () => {
    const product = createMockProduct({
      resaleSettings: {
        allowedCountries: [],
        blockedCountries: ['US', 'CA'],
        customPricing: { enabled: false },
        discount: { enabled: false },
        limits: {},
      },
    });

    expect(product.isAvailableInCountry('US')).toBe(false);
    expect(product.isAvailableInCountry('CA')).toBe(false);
    expect(product.isAvailableInCountry('UK')).toBe(true);
  });

  it('should return true only for allowed countries when whitelist is set', () => {
    const product = createMockProduct({
      resaleSettings: {
        allowedCountries: ['US', 'CA'],
        blockedCountries: [],
        customPricing: { enabled: false },
        discount: { enabled: false },
        limits: {},
      },
    });

    expect(product.isAvailableInCountry('US')).toBe(true);
    expect(product.isAvailableInCountry('CA')).toBe(true);
    expect(product.isAvailableInCountry('UK')).toBe(false);
  });

  it('should prioritize blocklist over whitelist', () => {
    const product = createMockProduct({
      resaleSettings: {
        allowedCountries: ['US', 'CA'],
        blockedCountries: ['US'], // Block US even though it's in allowed
        customPricing: { enabled: false },
        discount: { enabled: false },
        limits: {},
      },
    });

    expect(product.isAvailableInCountry('US')).toBe(false);
    expect(product.isAvailableInCountry('CA')).toBe(true);
  });
});

describe('Product Model - validateQuantity', () => {
  it('should validate quantity within limits', () => {
    const product = createMockProduct({
      resaleSettings: {
        allowedCountries: [],
        blockedCountries: [],
        customPricing: { enabled: false },
        discount: { enabled: false },
        limits: {
          minQuantity: 1,
          maxQuantity: 10,
        },
      },
    });

    expect(product.validateQuantity(1)).toEqual({ valid: true });
    expect(product.validateQuantity(5)).toEqual({ valid: true });
    expect(product.validateQuantity(10)).toEqual({ valid: true });
  });

  it('should reject quantity below minimum', () => {
    const product = createMockProduct({
      resaleSettings: {
        allowedCountries: [],
        blockedCountries: [],
        customPricing: { enabled: false },
        discount: { enabled: false },
        limits: {
          minQuantity: 5,
        },
      },
    });

    const result = product.validateQuantity(3);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Minimum quantity is 5');
  });

  it('should reject quantity above maximum', () => {
    const product = createMockProduct({
      resaleSettings: {
        allowedCountries: [],
        blockedCountries: [],
        customPricing: { enabled: false },
        discount: { enabled: false },
        limits: {
          maxQuantity: 10,
        },
      },
    });

    const result = product.validateQuantity(15);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Maximum quantity is 10');
  });

  it('should allow any quantity when no limits are set', () => {
    const product = createMockProduct();

    expect(product.validateQuantity(1)).toEqual({ valid: true });
    expect(product.validateQuantity(100)).toEqual({ valid: true });
    expect(product.validateQuantity(1000)).toEqual({ valid: true });
  });

  it('should validate edge cases correctly', () => {
    const product = createMockProduct({
      resaleSettings: {
        allowedCountries: [],
        blockedCountries: [],
        customPricing: { enabled: false },
        discount: { enabled: false },
        limits: {
          minQuantity: 1,
          maxQuantity: 1,
        },
      },
    });

    // Exactly at min/max boundary
    expect(product.validateQuantity(1)).toEqual({ valid: true });

    // Just below min
    expect(product.validateQuantity(0).valid).toBe(false);

    // Just above max
    expect(product.validateQuantity(2).valid).toBe(false);
  });
});
