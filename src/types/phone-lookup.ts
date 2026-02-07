/**
 * Phone Lookup API Types
 * Types for the /api/v1/lookup/phone endpoint
 */

export interface PricingBreakdown {
  costPrice: number;
  markup: number;
  priceBeforeDiscount: number;
  discount: number;
  finalPrice: number;
  discountApplied: boolean;
  // Pricing rule parameters for variable-value products
  pricingRule?: {
    type: 'percentage' | 'fixed' | 'percentage_plus_fixed';
    percentageValue?: number; // For percentage or percentage_plus_fixed
    fixedValue?: number; // For fixed or percentage_plus_fixed
  };
}

export interface ProductInfo {
  skuCode: string;
  name: string;
  providerCode: string;
  providerName: string;
  benefitType: 'airtime' | 'data' | 'voice' | 'sms' | 'bundle';
  benefitAmount: number;
  benefitUnit: string;
  pricing: PricingBreakdown;
  isVariableValue: boolean;
  minAmount?: number;
  maxAmount?: number;
  // Product classification fields
  benefits?: string[]; // e.g., ["Mobile", "Minutes", "Data"]
  validityPeriod?: string; // ISO 8601 duration (e.g., "P30D" for 30 days)
}

export interface OperatorInfo {
  code: string;
  name: string;
  logo?: string;
}

export interface CountryInfo {
  code: string;
  name: string;
}

export interface DiscountInfo {
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
}

export interface BrandingInfo {
  businessName: string;
  logo?: string;
  primaryColor?: string;
  description?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export interface PhoneLookupResponse {
  phoneNumber: string;
  country: CountryInfo;
  detectedOperators: OperatorInfo[];
  operators: OperatorInfo[];
  products: ProductInfo[];
  totalProducts: number;
  branding: BrandingInfo;
  discount: DiscountInfo | null;
}

export interface PhoneLookupRequest {
  phoneNumber: string;
  orgSlug: string;
}
