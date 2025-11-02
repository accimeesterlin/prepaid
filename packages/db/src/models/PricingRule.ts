import mongoose, { Document, Schema } from 'mongoose';

export interface IPricingRule extends Document {
  orgId: string;
  name: string;
  description?: string;

  // Pricing - can use percentage, fixed, or both
  percentageMarkup?: number; // Percentage markup (e.g., 20 for 20%)
  fixedMarkup?: number; // Fixed amount markup (e.g., 0.50 for $0.50)

  // Legacy fields (kept for backward compatibility)
  type?: 'percentage' | 'fixed';
  value?: number;

  priority: number; // Higher priority rules are applied first
  isActive: boolean;

  // Applicability
  applicableCountries?: string[]; // ISO country codes
  applicableRegions?: string[]; // e.g., "Africa", "Asia", "Europe", "Latin America", "Caribbean"
  excludedCountries?: string[]; // Countries to exclude even if in region

  // Limits
  minTransactionAmount?: number;
  maxTransactionAmount?: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Methods
  isApplicableToCountry(countryCode: string): boolean;
  calculateMarkup(amount: number): number;
}

// Regional country groupings
const REGIONS: { [key: string]: string[] } = {
  'Africa': ['DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CM', 'CV', 'CF', 'TD', 'KM', 'CG', 'CD', 'CI', 'DJ', 'EG', 'GQ', 'ER', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'YT', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RE', 'RW', 'SH', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'SZ', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW'],
  'Asia': ['AF', 'AM', 'AZ', 'BH', 'BD', 'BT', 'BN', 'KH', 'CN', 'CX', 'CC', 'IO', 'GE', 'HK', 'IN', 'ID', 'IR', 'IQ', 'IL', 'JP', 'JO', 'KZ', 'KW', 'KG', 'LA', 'LB', 'MO', 'MY', 'MV', 'MN', 'MM', 'NP', 'KP', 'OM', 'PK', 'PS', 'PH', 'QA', 'SA', 'SG', 'KR', 'LK', 'SY', 'TW', 'TJ', 'TH', 'TL', 'TR', 'TM', 'AE', 'UZ', 'VN', 'YE'],
  'Europe': ['AX', 'AL', 'AD', 'AT', 'BY', 'BE', 'BA', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FO', 'FI', 'FR', 'DE', 'GI', 'GR', 'GG', 'HU', 'IS', 'IE', 'IM', 'IT', 'JE', 'XK', 'LV', 'LI', 'LT', 'LU', 'MK', 'MT', 'MD', 'MC', 'ME', 'NL', 'NO', 'PL', 'PT', 'RO', 'RU', 'SM', 'RS', 'SK', 'SI', 'ES', 'SJ', 'SE', 'CH', 'UA', 'GB', 'VA'],
  'North America': ['AI', 'AG', 'AW', 'BS', 'BB', 'BZ', 'BM', 'BQ', 'VG', 'CA', 'KY', 'CR', 'CU', 'CW', 'DM', 'DO', 'SV', 'GL', 'GD', 'GP', 'GT', 'HT', 'HN', 'JM', 'MQ', 'MX', 'MS', 'NI', 'PA', 'PM', 'PR', 'BL', 'KN', 'LC', 'MF', 'VC', 'SX', 'TT', 'TC', 'US', 'VI'],
  'South America': ['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'FK', 'GF', 'GY', 'PY', 'PE', 'SR', 'UY', 'VE'],
  'Oceania': ['AS', 'AU', 'CK', 'FJ', 'PF', 'GU', 'KI', 'MH', 'FM', 'NR', 'NC', 'NZ', 'NU', 'NF', 'MP', 'PW', 'PG', 'PN', 'WS', 'SB', 'TK', 'TO', 'TV', 'UM', 'VU', 'WF'],
  'Caribbean': ['AI', 'AG', 'AW', 'BS', 'BB', 'BQ', 'VG', 'KY', 'CU', 'CW', 'DM', 'DO', 'GD', 'GP', 'HT', 'JM', 'MQ', 'MS', 'PR', 'BL', 'KN', 'LC', 'MF', 'VC', 'SX', 'TT', 'TC', 'VI'],
  'Latin America': ['AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GT', 'HT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'UY', 'VE'],
};

const PricingRuleSchema = new Schema<IPricingRule>(
  {
    orgId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // New fields - can use one or both
    percentageMarkup: {
      type: Number,
      min: 0,
    },
    fixedMarkup: {
      type: Number,
      min: 0,
    },
    // Legacy fields (kept for backward compatibility)
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
    },
    value: {
      type: Number,
      min: 0,
    },
    priority: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    applicableCountries: {
      type: [String],
      default: [],
    },
    applicableRegions: {
      type: [String],
      default: [],
    },
    excludedCountries: {
      type: [String],
      default: [],
    },
    minTransactionAmount: {
      type: Number,
      min: 0,
    },
    maxTransactionAmount: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
PricingRuleSchema.index({ orgId: 1, isActive: 1, priority: -1 });

// Check if rule is applicable to a specific country
PricingRuleSchema.methods.isApplicableToCountry = function (countryCode: string): boolean {
  if (!this.isActive) {
    return false;
  }

  // Check if country is explicitly excluded
  if (this.excludedCountries && this.excludedCountries.includes(countryCode)) {
    return false;
  }

  // If specific countries are defined, check if country is in the list
  if (this.applicableCountries && this.applicableCountries.length > 0) {
    return this.applicableCountries.includes(countryCode);
  }

  // If regions are defined, check if country is in any of the regions
  if (this.applicableRegions && this.applicableRegions.length > 0) {
    for (const region of this.applicableRegions) {
      const countriesInRegion = REGIONS[region] || [];
      if (countriesInRegion.includes(countryCode)) {
        return true;
      }
    }
    return false;
  }

  // If no specific countries or regions defined, rule applies to all countries
  return true;
};

// Calculate markup for a given amount
PricingRuleSchema.methods.calculateMarkup = function (amount: number): number {
  // Check transaction amount limits
  if (this.minTransactionAmount && amount < this.minTransactionAmount) {
    return 0;
  }

  if (this.maxTransactionAmount && amount > this.maxTransactionAmount) {
    return 0;
  }

  let markup = 0;

  // Use new fields if available
  if (this.percentageMarkup !== undefined || this.fixedMarkup !== undefined) {
    // Apply percentage markup first
    if (this.percentageMarkup && this.percentageMarkup > 0) {
      markup += amount * (this.percentageMarkup / 100);
    }

    // Add fixed markup
    if (this.fixedMarkup && this.fixedMarkup > 0) {
      markup += this.fixedMarkup;
    }
  }
  // Fall back to legacy fields for backward compatibility
  else if (this.type && this.value !== undefined) {
    if (this.type === 'percentage') {
      markup = amount * (this.value / 100);
    } else {
      markup = this.value;
    }
  }

  return Math.round(markup * 100) / 100; // Round to 2 decimal places
};

// Static method to get applicable regions list
PricingRuleSchema.statics.getAvailableRegions = function () {
  return Object.keys(REGIONS);
};

// Static method to get countries in a region
PricingRuleSchema.statics.getCountriesInRegion = function (region: string) {
  return REGIONS[region] || [];
};

export const PricingRule = mongoose.models.PricingRule || mongoose.model<IPricingRule>('PricingRule', PricingRuleSchema);
