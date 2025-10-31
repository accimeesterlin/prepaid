import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPaymentProvider extends Document {
  orgId: string;
  provider: 'stripe' | 'paypal' | 'pgpay';
  status: 'active' | 'inactive' | 'error';
  environment: 'sandbox' | 'production';
  credentials: {
    apiKey?: string;
    secretKey?: string;
    publishableKey?: string;
    clientId?: string;
    clientSecret?: string;
    webhookSecret?: string;
    merchantId?: string;
    [key: string]: any;
  };
  settings: {
    acceptedCurrencies: string[];
    minAmount?: number;
    maxAmount?: number;
    feePercentage?: number; // Platform fee percentage
    fixedFee?: number; // Fixed fee per transaction
    autoCapture?: boolean;
  };
  metadata: {
    lastTestSuccess?: Date;
    lastTestError?: string;
    totalTransactions?: number;
    totalAmount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PaymentProviderSchema = new Schema<IPaymentProvider>(
  {
    orgId: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ['stripe', 'paypal', 'pgpay'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'error'],
      default: 'inactive',
    },
    environment: {
      type: String,
      required: true,
      enum: ['sandbox', 'production'],
      default: 'sandbox',
    },
    credentials: {
      type: Schema.Types.Mixed,
      required: true,
    },
    settings: {
      acceptedCurrencies: {
        type: [String],
        default: ['USD'],
      },
      minAmount: Number,
      maxAmount: Number,
      feePercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      fixedFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      autoCapture: {
        type: Boolean,
        default: true,
      },
    },
    metadata: {
      lastTestSuccess: Date,
      lastTestError: String,
      totalTransactions: {
        type: Number,
        default: 0,
      },
      totalAmount: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for org and provider uniqueness
PaymentProviderSchema.index({ orgId: 1, provider: 1 }, { unique: true });

export const PaymentProvider: Model<IPaymentProvider> =
  mongoose.models.PaymentProvider ||
  mongoose.model<IPaymentProvider>('PaymentProvider', PaymentProviderSchema);
