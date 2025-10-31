import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomer extends Document {
  orgId: string;
  phoneNumber: string;
  email?: string;
  name?: string;
  country?: string;
  metadata: {
    totalPurchases: number;
    totalSpent: number;
    currency: string;
    lastPurchaseAt?: Date;
    acquisitionSource?: string;
    tags?: string[];
  };
  preferences: {
    favoriteOperators?: string[];
    favoriteProducts?: string[];
    notificationPreferences?: {
      email: boolean;
      sms: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    orgId: {
      type: String,
      required: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    metadata: {
      totalPurchases: {
        type: Number,
        default: 0,
      },
      totalSpent: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: 'USD',
      },
      lastPurchaseAt: Date,
      acquisitionSource: String,
      tags: [String],
    },
    preferences: {
      favoriteOperators: [String],
      favoriteProducts: [String],
      notificationPreferences: {
        email: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: true,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CustomerSchema.index({ orgId: 1, phoneNumber: 1 }, { unique: true });
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ 'metadata.totalPurchases': -1 });
CustomerSchema.index({ 'metadata.lastPurchaseAt': -1 });

export const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
