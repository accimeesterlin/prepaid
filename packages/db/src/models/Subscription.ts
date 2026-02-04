import mongoose, { Schema, Document } from "mongoose";

export enum SubscriptionStatus {
  ACTIVE = "active",
  PAST_DUE = "past_due",
  CANCELED = "canceled",
  TRIALING = "trialing",
  UNPAID = "unpaid",
}

export enum SubscriptionTier {
  STARTER = "starter",
  GROWTH = "growth",
  SCALE = "scale",
  ENTERPRISE = "enterprise",
}

export interface ISubscription extends Document {
  organizationId: mongoose.Types.ObjectId;
  tier: SubscriptionTier;
  status: SubscriptionStatus;

  // Billing
  monthlyFee: number;
  transactionFeePercentage: number;

  // Payment provider (Stripe)
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;

  // Billing period
  currentPeriodStart: Date;
  currentPeriodEnd: Date;

  // Usage tracking
  usageThisMonth: {
    transactions: number;
    transactionFees: number;
    totalRevenue: number;
    lastUpdated: Date;
  };

  // History
  history: Array<{
    tier: SubscriptionTier;
    changedAt: Date;
    changedBy?: mongoose.Types.ObjectId;
    reason?: string;
  }>;

  // Trial
  trialEndsAt?: Date;

  // Cancellation
  cancelAt?: Date;
  canceledAt?: Date;
  cancellationReason?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    tier: {
      type: String,
      enum: Object.values(SubscriptionTier),
      default: SubscriptionTier.STARTER,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.ACTIVE,
      required: true,
    },
    monthlyFee: {
      type: Number,
      default: 0,
      required: true,
    },
    transactionFeePercentage: {
      type: Number,
      default: 4.0,
      required: true,
    },
    stripeCustomerId: {
      type: String,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      index: true,
    },
    stripePriceId: {
      type: String,
    },
    currentPeriodStart: {
      type: Date,
      required: true,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
      default: () => {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        return date;
      },
    },
    usageThisMonth: {
      transactions: {
        type: Number,
        default: 0,
      },
      transactionFees: {
        type: Number,
        default: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    history: [
      {
        tier: {
          type: String,
          enum: Object.values(SubscriptionTier),
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        reason: String,
      },
    ],
    trialEndsAt: Date,
    cancelAt: Date,
    canceledAt: Date,
    cancellationReason: String,
  },
  {
    timestamps: true,
  },
);

// Indexes
subscriptionSchema.index({ organizationId: 1, status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });
subscriptionSchema.index({ stripeCustomerId: 1 });

// Methods
subscriptionSchema.methods.isActive = function (): boolean {
  return this.status === SubscriptionStatus.ACTIVE;
};

subscriptionSchema.methods.isInTrial = function (): boolean {
  if (!this.trialEndsAt) return false;
  return (
    new Date() < this.trialEndsAt && this.status === SubscriptionStatus.TRIALING
  );
};

subscriptionSchema.methods.daysUntilRenewal = function (): number {
  const now = new Date();
  const diff = this.currentPeriodEnd.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Pre-save middleware
subscriptionSchema.pre("save", function (next) {
  // Record tier changes in history
  if (this.isModified("tier") && !this.isNew) {
    this.history.push({
      tier: this.tier,
      changedAt: new Date(),
      reason: "Tier changed",
    });
  }
  next();
});

export const Subscription =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>("Subscription", subscriptionSchema);
