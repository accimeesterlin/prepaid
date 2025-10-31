import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
  orderId: string;
  orgId: string;
  customerId?: string;
  productId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentGateway?: 'stripe' | 'paypal' | 'pgpay';
  paymentId?: string;
  provider: 'dingconnect' | 'reloadly';
  providerTransactionId?: string;
  recipient: {
    phoneNumber: string;
    email?: string;
    name?: string;
  };
  operator: {
    id: string;
    name: string;
    country: string;
  };
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    failureReason?: string;
    retryCount: number;
  };
  timeline: {
    createdAt: Date;
    paidAt?: Date;
    processingAt?: Date;
    completedAt?: Date;
    failedAt?: Date;
    refundedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orgId: {
      type: String,
      required: true,
      index: true,
    },
    customerId: {
      type: String,
      index: true,
    },
    productId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'paid', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentGateway: {
      type: String,
      enum: ['stripe', 'paypal', 'pgpay'],
    },
    paymentId: {
      type: String,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ['dingconnect', 'reloadly'],
    },
    providerTransactionId: {
      type: String,
      index: true,
    },
    recipient: {
      phoneNumber: {
        type: String,
        required: true,
      },
      email: String,
      name: String,
    },
    operator: {
      id: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      failureReason: String,
      retryCount: {
        type: Number,
        default: 0,
      },
    },
    timeline: {
      createdAt: {
        type: Date,
        required: true,
        default: Date.now,
      },
      paidAt: Date,
      processingAt: Date,
      completedAt: Date,
      failedAt: Date,
      refundedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
TransactionSchema.index({ orgId: 1, status: 1, createdAt: -1 });
TransactionSchema.index({ 'recipient.phoneNumber': 1 });
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ paymentGateway: 1, paymentId: 1 });

// Generate orderId before save
TransactionSchema.pre('save', function (next) {
  if (!this.orderId) {
    this.orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
