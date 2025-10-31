import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStorefrontSettings extends Document {
  orgId: string;
  isActive: boolean;

  // Available countries
  countries: {
    enabled: string[]; // ISO country codes to enable
    disabled: string[]; // ISO country codes to disable
    allEnabled: boolean; // If true, all countries except disabled are available
  };

  // Pricing configuration
  pricing: {
    markupType: 'percentage' | 'fixed'; // How to apply markup
    markupValue: number; // Percentage (e.g., 10 for 10%) or fixed amount
    currency: string; // Base currency
    minTransactionAmount?: number;
    maxTransactionAmount?: number;
  };

  // Discount configuration
  discount: {
    enabled: boolean;
    type: 'percentage' | 'fixed';
    value: number;
    startDate?: Date;
    endDate?: Date;
    minPurchaseAmount?: number;
    applicableCountries?: string[]; // If empty, applies to all
    description?: string;
  };

  // Storefront customization
  branding: {
    businessName: string;
    logo?: string;
    primaryColor?: string;
    description?: string;
    supportEmail?: string;
    supportPhone?: string;
  };

  // Payment options
  paymentMethods: {
    stripe: boolean;
    paypal: boolean;
    pgpay: boolean;
  };

  // Terms and policies
  legal: {
    termsUrl?: string;
    privacyUrl?: string;
    refundPolicy?: string;
  };

  // Analytics
  metadata: {
    totalOrders?: number;
    totalRevenue?: number;
    lastOrderAt?: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

const StorefrontSettingsSchema = new Schema<IStorefrontSettings>(
  {
    orgId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    countries: {
      enabled: {
        type: [String],
        default: [],
      },
      disabled: {
        type: [String],
        default: [],
      },
      allEnabled: {
        type: Boolean,
        default: false,
      },
    },
    pricing: {
      markupType: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage',
      },
      markupValue: {
        type: Number,
        default: 10, // 10% default markup
        min: 0,
      },
      currency: {
        type: String,
        default: 'USD',
      },
      minTransactionAmount: Number,
      maxTransactionAmount: Number,
    },
    discount: {
      enabled: {
        type: Boolean,
        default: false,
      },
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
      },
      value: Number,
      startDate: Date,
      endDate: Date,
      minPurchaseAmount: Number,
      applicableCountries: [String],
      description: String,
    },
    branding: {
      businessName: {
        type: String,
        required: true,
      },
      logo: String,
      primaryColor: {
        type: String,
        default: '#3b82f6',
      },
      description: String,
      supportEmail: String,
      supportPhone: String,
    },
    paymentMethods: {
      stripe: {
        type: Boolean,
        default: false,
      },
      paypal: {
        type: Boolean,
        default: false,
      },
      pgpay: {
        type: Boolean,
        default: false,
      },
    },
    legal: {
      termsUrl: String,
      privacyUrl: String,
      refundPolicy: String,
    },
    metadata: {
      totalOrders: {
        type: Number,
        default: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
      },
      lastOrderAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Method to check if country is enabled
StorefrontSettingsSchema.methods.isCountryEnabled = function (countryCode: string): boolean {
  if (this.countries.disabled.includes(countryCode)) {
    return false;
  }

  if (this.countries.allEnabled) {
    return true;
  }

  return this.countries.enabled.includes(countryCode);
};

// Method to calculate final price with markup and discount
StorefrontSettingsSchema.methods.calculateFinalPrice = function (
  costPrice: number,
  countryCode?: string
): {
  costPrice: number;
  markup: number;
  priceBeforeDiscount: number;
  discount: number;
  finalPrice: number;
  discountApplied: boolean;
} {
  let priceAfterMarkup = costPrice;

  // Apply markup
  if (this.pricing.markupType === 'percentage') {
    priceAfterMarkup = costPrice * (1 + this.pricing.markupValue / 100);
  } else {
    priceAfterMarkup = costPrice + this.pricing.markupValue;
  }

  const markup = priceAfterMarkup - costPrice;
  let finalPrice = priceAfterMarkup;
  let discountAmount = 0;
  let discountApplied = false;

  // Apply discount if enabled and valid
  if (this.discount.enabled) {
    const now = new Date();
    const isDateValid =
      (!this.discount.startDate || this.discount.startDate <= now) &&
      (!this.discount.endDate || this.discount.endDate >= now);

    const isCountryValid =
      !countryCode ||
      !this.discount.applicableCountries ||
      this.discount.applicableCountries.length === 0 ||
      this.discount.applicableCountries.includes(countryCode);

    const isAmountValid =
      !this.discount.minPurchaseAmount || priceAfterMarkup >= this.discount.minPurchaseAmount;

    if (isDateValid && isCountryValid && isAmountValid) {
      if (this.discount.type === 'percentage') {
        discountAmount = priceAfterMarkup * (this.discount.value / 100);
      } else {
        discountAmount = this.discount.value;
      }
      finalPrice = Math.max(0, priceAfterMarkup - discountAmount);
      discountApplied = true;
    }
  }

  return {
    costPrice,
    markup: Math.round(markup * 100) / 100,
    priceBeforeDiscount: Math.round(priceAfterMarkup * 100) / 100,
    discount: Math.round(discountAmount * 100) / 100,
    finalPrice: Math.round(finalPrice * 100) / 100,
    discountApplied,
  };
};

export const StorefrontSettings: Model<IStorefrontSettings> =
  mongoose.models.StorefrontSettings ||
  mongoose.model<IStorefrontSettings>('StorefrontSettings', StorefrontSettingsSchema);
