import mongoose, { Schema, Document, Model } from 'mongoose';
import { UserRole } from '@pg-prepaid/types';

export interface IUserOrganization extends Document {
  userId: mongoose.Types.ObjectId;
  orgId: mongoose.Types.ObjectId;
  roles: UserRole[];
  isActive: boolean;
  invitedBy?: mongoose.Types.ObjectId;
  invitedAt?: Date;
  joinedAt: Date;
  balanceLimit?: {
    enabled: boolean;
    maxBalance: number;
    currentUsed: number;
  };
  createdAt: Date;
  updatedAt: Date;

  // Methods
  hasAvailableBalance(amount: number): boolean;
  useBalance(amount: number, metadata?: { phoneNumber?: string; productName?: string; orderId?: string }): Promise<void>;
  resetBalance(adminId?: mongoose.Types.ObjectId): Promise<void>;
}

const UserOrganizationSchema = new Schema<IUserOrganization>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Org',
      required: true,
      index: true,
    },
    roles: {
      type: [String],
      enum: Object.values(UserRole),
      default: [UserRole.VIEWER],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    invitedAt: {
      type: Date,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    balanceLimit: {
      enabled: {
        type: Boolean,
        default: false,
      },
      maxBalance: {
        type: Number,
        default: 0,
      },
      currentUsed: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
UserOrganizationSchema.index({ userId: 1, orgId: 1 }, { unique: true });
UserOrganizationSchema.index({ userId: 1, isActive: 1 });
UserOrganizationSchema.index({ orgId: 1, isActive: 1 });

// Instance Methods
UserOrganizationSchema.methods.hasAvailableBalance = function (amount: number): boolean {
  // If balance limit is not enabled, allow unlimited access
  if (!this.balanceLimit || !this.balanceLimit.enabled) {
    return true;
  }

  const available = this.balanceLimit.maxBalance - this.balanceLimit.currentUsed;
  return available >= amount;
};

UserOrganizationSchema.methods.useBalance = async function (amount: number, metadata?: { phoneNumber?: string; productName?: string; orderId?: string }): Promise<void> {
  if (!this.balanceLimit || !this.balanceLimit.enabled) {
    return; // No limit, allow transaction
  }

  if (!this.hasAvailableBalance(amount)) {
    throw new Error('Insufficient balance limit. Please contact your administrator.');
  }

  const previousBalance = this.balanceLimit.currentUsed;
  this.balanceLimit.currentUsed += amount;
  await this.save();

  // Create history record
  try {
    const { BalanceHistory } = await import('./BalanceHistory');
    await BalanceHistory.create({
      userOrgId: this._id,
      orgId: this.orgId,
      userId: this.userId,
      amount,
      type: 'usage',
      previousBalance,
      newBalance: this.balanceLimit.currentUsed,
      description: `Used $${amount.toFixed(2)} for ${metadata?.productName || 'transaction'}`,
      metadata,
    });
  } catch (error) {
    console.error('Failed to create balance history:', error);
    // Don't fail the transaction if history creation fails
  }
};

UserOrganizationSchema.methods.resetBalance = async function (adminId?: mongoose.Types.ObjectId): Promise<void> {
  const previousBalance = this.balanceLimit?.currentUsed || 0;

  if (!this.balanceLimit) {
    this.balanceLimit = {
      enabled: false,
      maxBalance: 0,
      currentUsed: 0,
    };
  } else {
    this.balanceLimit.currentUsed = 0;
  }
  await this.save();

  // Create history record
  if (previousBalance > 0) {
    try {
      const { BalanceHistory } = await import('./BalanceHistory');
      await BalanceHistory.create({
        userOrgId: this._id,
        orgId: this.orgId,
        userId: this.userId,
        amount: -previousBalance,
        type: 'reset',
        previousBalance,
        newBalance: 0,
        description: `Balance reset by administrator`,
        metadata: {
          adminId,
        },
      });
    } catch (error) {
      console.error('Failed to create balance history:', error);
    }
  }
};

export const UserOrganization: Model<IUserOrganization> =
  mongoose.models.UserOrganization ||
  mongoose.model<IUserOrganization>('UserOrganization', UserOrganizationSchema);
