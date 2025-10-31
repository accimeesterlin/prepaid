import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  orgId: string;
  name: string;
  description?: string;
  provider: 'dingconnect' | 'reloadly';
  providerProductId: string; // External product ID from provider
  operatorId: string; // External operator ID
  operatorName: string;
  operatorCountry: string;
  operatorLogo?: string;
  pricing: {
    costPrice: number; // What we pay to the provider
    sellPrice: number; // What we charge the customer
    currency: string;
    profitMargin: number; // Percentage
  };
  denomination: {
    type: 'fixed' | 'range';
    fixedAmount?: number;
    minAmount?: number;
    maxAmount?: number;
    unit: string; // 'USD', 'minutes', 'data'
  };
  status: 'active' | 'inactive' | 'out_of_stock';
  metadata: {
    category?: string;
    tags?: string[];
    popularity?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
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
    provider: {
      type: String,
      required: true,
      enum: ['dingconnect', 'reloadly'],
    },
    providerProductId: {
      type: String,
      required: true,
    },
    operatorId: {
      type: String,
      required: true,
    },
    operatorName: {
      type: String,
      required: true,
    },
    operatorCountry: {
      type: String,
      required: true,
    },
    operatorLogo: String,
    pricing: {
      costPrice: {
        type: Number,
        required: true,
        min: 0,
      },
      sellPrice: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        required: true,
        default: 'USD',
      },
      profitMargin: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    denomination: {
      type: {
        type: String,
        enum: ['fixed', 'range'],
        required: true,
      },
      fixedAmount: Number,
      minAmount: Number,
      maxAmount: Number,
      unit: {
        type: String,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'out_of_stock'],
      default: 'active',
    },
    metadata: {
      category: String,
      tags: [String],
      popularity: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ProductSchema.index({ orgId: 1, status: 1 });
ProductSchema.index({ operatorCountry: 1 });
ProductSchema.index({ provider: 1, providerProductId: 1 });
ProductSchema.index({ 'metadata.category': 1 });

// Validate sell price >= cost price
ProductSchema.pre('save', function (next) {
  if (this.pricing.sellPrice < this.pricing.costPrice) {
    next(new Error('Sell price must be greater than or equal to cost price'));
  }
  // Calculate profit margin
  this.pricing.profitMargin = ((this.pricing.sellPrice - this.pricing.costPrice) / this.pricing.costPrice) * 100;
  next();
});

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
