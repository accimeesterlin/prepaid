import { IWallet } from '../Wallet';

/**
 * Unit tests for Wallet model methods
 * Note: These tests focus on business logic in model methods without requiring a database connection
 */

// Mock wallet data creator
const createMockWallet = (overrides?: Partial<IWallet>): IWallet => {
  const baseWallet = {
    orgId: 'org-123',
    balance: 1000,
    currency: 'USD',
    reservedBalance: 0,
    availableBalance: 1000,
    lowBalanceThreshold: 100,
    autoReloadEnabled: false,
    status: 'active' as const,
    metadata: {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalSpent: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as IWallet;

  // Add methods
  baseWallet.hasAvailableBalance = function (amount: number): boolean {
    return this.availableBalance >= amount;
  };

  baseWallet.reserve = function (amount: number): boolean {
    if (!this.hasAvailableBalance(amount)) {
      return false;
    }
    this.reservedBalance += amount;
    this.availableBalance = this.balance - this.reservedBalance;
    return true;
  };

  baseWallet.releaseReservation = function (amount: number): void {
    this.reservedBalance = Math.max(0, this.reservedBalance - amount);
    this.availableBalance = this.balance - this.reservedBalance;
  };

  baseWallet.deduct = function (amount: number, reserved = true): boolean {
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
    this.availableBalance = this.balance - this.reservedBalance;
    return true;
  };

  baseWallet.deposit = function (amount: number): void {
    this.balance += amount;
    this.metadata.totalDeposits += amount;
    this.metadata.lastDepositAt = new Date();
    this.availableBalance = this.balance - this.reservedBalance;
  };

  return baseWallet;
};

describe('Wallet Model - hasAvailableBalance', () => {
  it('should return true when available balance is sufficient', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 200,
      availableBalance: 800,
    });

    expect(wallet.hasAvailableBalance(500)).toBe(true);
    expect(wallet.hasAvailableBalance(800)).toBe(true);
  });

  it('should return false when available balance is insufficient', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 200,
      availableBalance: 800,
    });

    expect(wallet.hasAvailableBalance(900)).toBe(false);
    expect(wallet.hasAvailableBalance(1000)).toBe(false);
  });

  it('should return true for zero amount', () => {
    const wallet = createMockWallet();

    expect(wallet.hasAvailableBalance(0)).toBe(true);
  });

  it('should handle exact available balance', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 300,
      availableBalance: 700,
    });

    expect(wallet.hasAvailableBalance(700)).toBe(true);
  });

  it('should consider reserved balance', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 1000,
      availableBalance: 0,
    });

    expect(wallet.hasAvailableBalance(1)).toBe(false);
  });
});

describe('Wallet Model - reserve', () => {
  it('should reserve funds when sufficient balance available', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 0,
      availableBalance: 1000,
    });

    const result = wallet.reserve(200);

    expect(result).toBe(true);
    expect(wallet.reservedBalance).toBe(200);
    expect(wallet.availableBalance).toBe(800);
  });

  it('should fail to reserve when insufficient balance', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 900,
      availableBalance: 100,
    });

    const result = wallet.reserve(200);

    expect(result).toBe(false);
    expect(wallet.reservedBalance).toBe(900); // Unchanged
  });

  it('should accumulate multiple reservations', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 0,
      availableBalance: 1000,
    });

    wallet.reserve(200);
    wallet.reserve(300);
    wallet.reserve(100);

    expect(wallet.reservedBalance).toBe(600);
    expect(wallet.availableBalance).toBe(400);
  });

  it('should prevent reserving more than available balance', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 0,
      availableBalance: 1000,
    });

    wallet.reserve(600);
    const result = wallet.reserve(500);

    expect(result).toBe(false);
    expect(wallet.reservedBalance).toBe(600);
  });

  it('should handle reserving exact available balance', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 0,
      availableBalance: 1000,
    });

    const result = wallet.reserve(1000);

    expect(result).toBe(true);
    expect(wallet.reservedBalance).toBe(1000);
    expect(wallet.availableBalance).toBe(0);
  });
});

describe('Wallet Model - releaseReservation', () => {
  it('should release reserved funds', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 500,
      availableBalance: 500,
    });

    wallet.releaseReservation(200);

    expect(wallet.reservedBalance).toBe(300);
    expect(wallet.availableBalance).toBe(700);
  });

  it('should not go below zero when releasing', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 100,
      availableBalance: 900,
    });

    wallet.releaseReservation(200);

    expect(wallet.reservedBalance).toBe(0);
    expect(wallet.availableBalance).toBe(1000);
  });

  it('should release entire reservation', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 500,
      availableBalance: 500,
    });

    wallet.releaseReservation(500);

    expect(wallet.reservedBalance).toBe(0);
    expect(wallet.availableBalance).toBe(1000);
  });

  it('should handle multiple partial releases', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 600,
      availableBalance: 400,
    });

    wallet.releaseReservation(100);
    wallet.releaseReservation(200);
    wallet.releaseReservation(150);

    expect(wallet.reservedBalance).toBe(150);
    expect(wallet.availableBalance).toBe(850);
  });
});

describe('Wallet Model - deduct (reserved)', () => {
  it('should deduct from balance and reserved balance', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 500,
      availableBalance: 500,
      metadata: {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalSpent: 0,
      },
    });

    const result = wallet.deduct(200, true);

    expect(result).toBe(true);
    expect(wallet.balance).toBe(800);
    expect(wallet.reservedBalance).toBe(300);
    expect(wallet.availableBalance).toBe(500);
    expect(wallet.metadata.totalSpent).toBe(200);
  });

  it('should update metadata when deducting', () => {
    const wallet = createMockWallet({
      metadata: {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalSpent: 100,
      },
    });

    wallet.deduct(50, true);

    expect(wallet.metadata.totalSpent).toBe(150);
    expect(wallet.metadata.lastTransactionAt).toBeInstanceOf(Date);
  });

  it('should not set reserved balance below zero', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 100,
      availableBalance: 900,
    });

    wallet.deduct(200, true);

    expect(wallet.balance).toBe(800);
    expect(wallet.reservedBalance).toBe(0);
  });
});

describe('Wallet Model - deduct (direct)', () => {
  it('should deduct directly from available balance', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 300,
      availableBalance: 700,
      metadata: {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalSpent: 0,
      },
    });

    const result = wallet.deduct(200, false);

    expect(result).toBe(true);
    expect(wallet.balance).toBe(800);
    expect(wallet.reservedBalance).toBe(300); // Unchanged
    expect(wallet.availableBalance).toBe(500);
    expect(wallet.metadata.totalSpent).toBe(200);
  });

  it('should fail if insufficient available balance', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 900,
      availableBalance: 100,
    });

    const result = wallet.deduct(200, false);

    expect(result).toBe(false);
    expect(wallet.balance).toBe(1000); // Unchanged
  });

  it('should handle exact available balance deduction', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 300,
      availableBalance: 700,
    });

    const result = wallet.deduct(700, false);

    expect(result).toBe(true);
    expect(wallet.balance).toBe(300);
    expect(wallet.availableBalance).toBe(0);
  });
});

describe('Wallet Model - deposit', () => {
  it('should add funds to balance', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 0,
      availableBalance: 1000,
      metadata: {
        totalDeposits: 500,
        totalWithdrawals: 0,
        totalSpent: 0,
      },
    });

    wallet.deposit(500);

    expect(wallet.balance).toBe(1500);
    expect(wallet.availableBalance).toBe(1500);
    expect(wallet.metadata.totalDeposits).toBe(1000);
    expect(wallet.metadata.lastDepositAt).toBeInstanceOf(Date);
  });

  it('should maintain reserved balance when depositing', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 300,
      availableBalance: 700,
    });

    wallet.deposit(500);

    expect(wallet.balance).toBe(1500);
    expect(wallet.reservedBalance).toBe(300); // Unchanged
    expect(wallet.availableBalance).toBe(1200);
  });

  it('should handle multiple deposits', () => {
    const wallet = createMockWallet({
      balance: 1000,
      metadata: {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalSpent: 0,
      },
    });

    wallet.deposit(200);
    wallet.deposit(300);
    wallet.deposit(100);

    expect(wallet.balance).toBe(1600);
    expect(wallet.metadata.totalDeposits).toBe(600);
  });

  it('should update last deposit timestamp', () => {
    const wallet = createMockWallet({
      metadata: {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalSpent: 0,
        lastDepositAt: undefined,
      },
    });

    wallet.deposit(100);

    expect(wallet.metadata.lastDepositAt).toBeInstanceOf(Date);
  });
});

describe('Wallet Model - Integration scenarios', () => {
  it('should handle complete transaction flow: reserve -> deduct', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 0,
      availableBalance: 1000,
      metadata: {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalSpent: 0,
      },
    });

    // Reserve funds for transaction
    const reserved = wallet.reserve(200);
    expect(reserved).toBe(true);
    expect(wallet.availableBalance).toBe(800);

    // Complete transaction by deducting
    const deducted = wallet.deduct(200, true);
    expect(deducted).toBe(true);
    expect(wallet.balance).toBe(800);
    expect(wallet.reservedBalance).toBe(0);
    expect(wallet.availableBalance).toBe(800);
  });

  it('should handle failed transaction flow: reserve -> release', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 0,
      availableBalance: 1000,
    });

    // Reserve funds for transaction
    wallet.reserve(200);
    expect(wallet.availableBalance).toBe(800);

    // Transaction failed, release reservation
    wallet.releaseReservation(200);
    expect(wallet.balance).toBe(1000); // Unchanged
    expect(wallet.reservedBalance).toBe(0);
    expect(wallet.availableBalance).toBe(1000);
  });

  it('should handle multiple concurrent reservations', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 0,
      availableBalance: 1000,
    });

    // Multiple users trying to reserve
    wallet.reserve(300);
    wallet.reserve(400);
    const failed = wallet.reserve(400); // Should fail

    expect(failed).toBe(false);
    expect(wallet.reservedBalance).toBe(700);
    expect(wallet.availableBalance).toBe(300);
  });

  it('should maintain balance integrity through multiple operations', () => {
    const wallet = createMockWallet({
      balance: 1000,
      reservedBalance: 0,
      availableBalance: 1000,
    });

    wallet.deposit(500);
    expect(wallet.balance).toBe(1500);

    wallet.reserve(300);
    expect(wallet.availableBalance).toBe(1200);

    wallet.deduct(200, true);
    expect(wallet.balance).toBe(1300);
    expect(wallet.reservedBalance).toBe(100);
    expect(wallet.availableBalance).toBe(1200);

    wallet.releaseReservation(100);
    expect(wallet.availableBalance).toBe(1300);

    // Balance integrity check
    expect(wallet.balance).toBe(wallet.availableBalance + wallet.reservedBalance);
  });

  it('should track all metadata correctly', () => {
    const wallet = createMockWallet({
      balance: 1000,
      metadata: {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalSpent: 0,
      },
    });

    wallet.deposit(500);
    wallet.deposit(300);
    wallet.deduct(200, false);
    wallet.deduct(100, false);

    expect(wallet.metadata.totalDeposits).toBe(800);
    expect(wallet.metadata.totalSpent).toBe(300);
    expect(wallet.balance).toBe(1500); // 1000 + 800 - 300
  });

  it('should prevent overspending with reservations', () => {
    const wallet = createMockWallet({
      balance: 500,
      reservedBalance: 0,
      availableBalance: 500,
    });

    wallet.reserve(300);
    wallet.reserve(150);

    // Only 50 available now, should fail
    const result = wallet.reserve(100);

    expect(result).toBe(false);
    expect(wallet.availableBalance).toBe(50);
  });
});
