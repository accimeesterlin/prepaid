import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface ICustomer extends Document {
  orgId: string;
  phoneNumber: string;
  email?: string;
  name?: string;
  country?: string;

  // Organization features
  isFavorite: boolean;
  groups: string[]; // Array of group IDs

  // Authentication fields
  passwordHash?: string;
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  resetPasswordToken?: string;
  resetPasswordTokenExpiry?: Date;

  // Two-Factor Authentication
  twoFactorEnabled: boolean;
  twoFactorCode?: string;
  twoFactorCodeExpiry?: Date;
  twoFactorVerified?: boolean;

  // Balance fields
  currentBalance: number;
  totalAssigned: number;
  totalUsed: number;
  balanceCurrency: string;
  balanceLimit?: {
    enabled: boolean;
    maxBalance: number;
  };

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

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasBalance(amount: number): boolean;
  deductBalance(
    amount: number,
    description: string,
    metadata?: any,
  ): Promise<void>;
  addBalance(
    amount: number,
    description: string,
    metadata?: any,
  ): Promise<void>;
  canUseBalance(): boolean;
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

    // Organization features
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
    groups: {
      type: [String],
      default: [],
      index: true,
    },

    // Authentication fields
    passwordHash: {
      type: String,
      select: false, // Don't return by default
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    verificationTokenExpiry: {
      type: Date,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordTokenExpiry: {
      type: Date,
      select: false,
    },

    // Two-Factor Authentication
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorCode: {
      type: String,
      select: false,
    },
    twoFactorCodeExpiry: {
      type: Date,
      select: false,
    },
    twoFactorVerified: {
      type: Boolean,
      default: false,
      select: false,
    },

    // Balance fields
    currentBalance: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    totalAssigned: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceCurrency: {
      type: String,
      default: "USD",
    },
    balanceLimit: {
      enabled: {
        type: Boolean,
        default: false,
      },
      maxBalance: {
        type: Number,
        default: 0,
        min: 0,
      },
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
        default: "USD",
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
  },
);

// Indexes
CustomerSchema.index({ orgId: 1, phoneNumber: 1 }, { unique: true });
CustomerSchema.index({ orgId: 1, email: 1 }, { sparse: true });
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ "metadata.totalPurchases": -1 });
CustomerSchema.index({ "metadata.lastPurchaseAt": -1 });
CustomerSchema.index({ emailVerified: 1 });
CustomerSchema.index({ currentBalance: -1 });

// Password comparison method
CustomerSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Check if customer has sufficient balance
CustomerSchema.methods.hasBalance = function (amount: number): boolean {
  return this.currentBalance >= amount;
};

// Check if customer can use balance (must be verified)
CustomerSchema.methods.canUseBalance = function (): boolean {
  return this.emailVerified && this.currentBalance > 0;
};

// Deduct balance with history tracking
CustomerSchema.methods.deductBalance = async function (
  amount: number,
  description: string,
  metadata?: any,
): Promise<void> {
  if (!this.hasBalance(amount)) {
    throw new Error("Insufficient balance");
  }

  const previousBalance = this.currentBalance;
  this.currentBalance -= amount;
  this.totalUsed += amount;

  await this.save();

  // Create balance history record
  const CustomerBalanceHistory = mongoose.model("CustomerBalanceHistory");
  await CustomerBalanceHistory.create({
    customerId: this._id,
    orgId: this.orgId,
    amount: -amount,
    type: "usage",
    previousBalance,
    newBalance: this.currentBalance,
    description,
    metadata,
  });
};

// Add balance with history tracking
CustomerSchema.methods.addBalance = async function (
  amount: number,
  description: string,
  metadata?: any,
): Promise<void> {
  const previousBalance = this.currentBalance;
  this.currentBalance += amount;
  this.totalAssigned += amount;

  await this.save();

  // Create balance history record
  const CustomerBalanceHistory = mongoose.model("CustomerBalanceHistory");
  await CustomerBalanceHistory.create({
    customerId: this._id,
    orgId: this.orgId,
    amount,
    type: "assignment",
    previousBalance,
    newBalance: this.currentBalance,
    description,
    metadata,
  });
};

// Hash password before saving
CustomerSchema.pre("save", async function (next) {
  if (
    this.isModified("passwordHash") &&
    this.passwordHash &&
    !/^\$2[aby]\$\d+\$/.test(this.passwordHash)
  ) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  }
  next();
});

export const Customer: Model<ICustomer> =
  mongoose.models.Customer ||
  mongoose.model<ICustomer>("Customer", CustomerSchema);
