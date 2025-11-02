import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBalanceHistory extends Document {
  userOrgId: mongoose.Types.ObjectId;
  orgId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  type: 'usage' | 'reset' | 'limit_update';
  previousBalance: number;
  newBalance: number;
  description: string;
  metadata?: {
    phoneNumber?: string;
    productName?: string;
    orderId?: string;
    adminId?: mongoose.Types.ObjectId;
  };
  createdAt: Date;
}

const BalanceHistorySchema = new Schema<IBalanceHistory>(
  {
    userOrgId: {
      type: Schema.Types.ObjectId,
      ref: 'UserOrganization',
      required: true,
      index: true,
    },
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['usage', 'reset', 'limit_update'],
      required: true,
      index: true,
    },
    previousBalance: {
      type: Number,
      required: true,
    },
    newBalance: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      phoneNumber: String,
      productName: String,
      orderId: String,
      adminId: Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
BalanceHistorySchema.index({ userOrgId: 1, createdAt: -1 });
BalanceHistorySchema.index({ orgId: 1, createdAt: -1 });
BalanceHistorySchema.index({ userId: 1, createdAt: -1 });

export const BalanceHistory: Model<IBalanceHistory> =
  mongoose.models.BalanceHistory ||
  mongoose.model<IBalanceHistory>('BalanceHistory', BalanceHistorySchema);
