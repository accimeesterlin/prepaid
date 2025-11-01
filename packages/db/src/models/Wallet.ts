import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWallet extends Document {
  orgId: string;
  balance: number;
  currency: string;
  reservedBalance: number; // Amount reserved for pending transactions
  availableBalance: number; // balance - reservedBalance
  lowBalanceThreshold: number;
  autoReloadEnabled: boolean;
  autoReloadAmount?: number;
  status: 'active' | 'suspended' | 'frozen';
  metadata: {
    totalDeposits: number;
    totalWithdrawals: number;
    totalSpent: number;
    lastDepositAt?: Date;
    lastTransactionAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;

  // Methods
  hasAvailableBalance(amount: number): boolean;
  reserve(amount: number): boolean;
  releaseReservation(amount: number): void;
  deduct(amount: number, reserved?: boolean): boolean;
  deposit(amount: number): void;
}

const WalletSchema = new Schema<IWallet>(
  {
    orgId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    reservedBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowBalanceThreshold: {
      type: Number,
      default: 100,
      min: 0,
    },
    autoReloadEnabled: {
      type: Boolean,
      default: false,
    },
    autoReloadAmount: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'frozen'],
      default: 'active',
    },
    metadata: {
      totalDeposits: {
        type: Number,
        default: 0,
      },
      totalWithdrawals: {
        type: Number,
        default: 0,
      },
      totalSpent: {
        type: Number,
        default: 0,
      },
      lastDepositAt: Date,
      lastTransactionAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate available balance before save
WalletSchema.pre('save', function (next) {
  this.availableBalance = this.balance - this.reservedBalance;
  next();
});

// Methods
WalletSchema.methods.hasAvailableBalance = function (amount: number): boolean {
  return this.availableBalance >= amount;
};

WalletSchema.methods.reserve = function (amount: number): boolean {
  if (!this.hasAvailableBalance(amount)) {
    return false;
  }
  this.reservedBalance += amount;
  return true;
};

WalletSchema.methods.releaseReservation = function (amount: number): void {
  this.reservedBalance = Math.max(0, this.reservedBalance - amount);
};

WalletSchema.methods.deduct = function (amount: number, reserved = true): boolean {
  if (reserved) {
    // Deduct from both balance and reserved
    this.balance -= amount;
    this.reservedBalance = Math.max(0, this.reservedBalance - amount);
  } else {
    // Direct deduction
    if (this.availableBalance < amount) {
      return false;
    }
    this.balance -= amount;
  }
  this.metadata.totalSpent += amount;
  this.metadata.lastTransactionAt = new Date();
  return true;
};

WalletSchema.methods.deposit = function (amount: number): void {
  this.balance += amount;
  this.metadata.totalDeposits += amount;
  this.metadata.lastDepositAt = new Date();
};

export const Wallet: Model<IWallet> =
  mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema);
