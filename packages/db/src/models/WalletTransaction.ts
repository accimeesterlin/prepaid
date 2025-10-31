import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWalletTransaction extends Document {
  orgId: string;
  walletId: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'refund' | 'fee' | 'adjustment';
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  reference: {
    type: 'order' | 'payment' | 'manual' | 'system';
    id?: string; // Order ID, Payment ID, etc.
    description?: string;
  };
  paymentMethod?: {
    provider: 'stripe' | 'paypal' | 'pgpay' | 'bank_transfer' | 'manual';
    transactionId?: string;
    last4?: string;
    brand?: string;
  };
  metadata: {
    processedBy?: string; // User ID who processed it
    notes?: string;
    ipAddress?: string;
    failureReason?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    orgId: {
      type: String,
      required: true,
      index: true,
    },
    walletId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['deposit', 'withdrawal', 'purchase', 'refund', 'fee', 'adjustment'],
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'reversed'],
      default: 'pending',
      index: true,
    },
    reference: {
      type: {
        type: String,
        required: true,
        enum: ['order', 'payment', 'manual', 'system'],
      },
      id: String,
      description: String,
    },
    paymentMethod: {
      provider: {
        type: String,
        enum: ['stripe', 'paypal', 'pgpay', 'bank_transfer', 'manual'],
      },
      transactionId: String,
      last4: String,
      brand: String,
    },
    metadata: {
      processedBy: String,
      notes: String,
      ipAddress: String,
      failureReason: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
WalletTransactionSchema.index({ orgId: 1, createdAt: -1 });
WalletTransactionSchema.index({ walletId: 1, type: 1 });
WalletTransactionSchema.index({ 'reference.id': 1 });
WalletTransactionSchema.index({ 'paymentMethod.transactionId': 1 });

export const WalletTransaction: Model<IWalletTransaction> =
  mongoose.models.WalletTransaction ||
  mongoose.model<IWalletTransaction>('WalletTransaction', WalletTransactionSchema);
