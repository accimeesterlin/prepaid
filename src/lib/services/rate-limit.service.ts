/**
 * Rate Limiting Service
 * Implements dual-layer rate limiting:
 * 1. Per-API-key rate limiting with custom limits
 * 2. Per-organization rate limiting
 */

interface RateLimitConfig {
  requests: number;
  window: number; // in seconds
}

interface RateLimitState {
  count: number;
  resetAt: number; // timestamp
}

export class RateLimitService {
  private keyLimits: Map<string, RateLimitState> = new Map();
  private orgLimits: Map<string, RateLimitState> = new Map();

  // Organization-wide limits (default: 10000 requests/hour)
  private readonly ORG_DEFAULT_LIMIT: RateLimitConfig = {
    requests: 10000,
    window: 3600,
  };

  /**
   * Check if a request is within rate limits
   * Returns { allowed: boolean, remaining: number, resetAt: number }
   */
  async checkLimit(
    identifier: string,
    type: "key" | "org",
    config: RateLimitConfig,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
    limit: number;
  }> {
    const now = Date.now();
    const limitsMap = type === "key" ? this.keyLimits : this.orgLimits;

    let state = limitsMap.get(identifier);

    // Initialize or reset if window has passed
    if (!state || now >= state.resetAt) {
      state = {
        count: 0,
        resetAt: now + config.window * 1000,
      };
      limitsMap.set(identifier, state);
    }

    const allowed = state.count < config.requests;
    const remaining = Math.max(0, config.requests - state.count);

    return {
      allowed,
      remaining,
      resetAt: state.resetAt,
      limit: config.requests,
    };
  }

  /**
   * Record a request (increment counter)
   */
  async recordRequest(identifier: string, type: "key" | "org"): Promise<void> {
    const limitsMap = type === "key" ? this.keyLimits : this.orgLimits;
    const state = limitsMap.get(identifier);

    if (state) {
      state.count += 1;
    }
  }

  /**
   * Check both API key and organization limits
   * Returns the most restrictive result
   */
  async checkBothLimits(
    apiKeyId: string,
    orgId: string,
    keyConfig: RateLimitConfig,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
    limit: number;
    limitType: "key" | "org";
  }> {
    // Check API key limit
    const keyLimit = await this.checkLimit(apiKeyId, "key", keyConfig);

    // Check organization limit
    const orgLimit = await this.checkLimit(
      orgId,
      "org",
      this.ORG_DEFAULT_LIMIT,
    );

    // Return the most restrictive
    if (!keyLimit.allowed) {
      return { ...keyLimit, limitType: "key" };
    }

    if (!orgLimit.allowed) {
      return { ...orgLimit, limitType: "org" };
    }

    // Both allowed - return the one with fewer remaining requests
    const limitType = keyLimit.remaining < orgLimit.remaining ? "key" : "org";
    return {
      ...(limitType === "key" ? keyLimit : orgLimit),
      limitType,
    };
  }

  /**
   * Record requests for both key and org
   */
  async recordBothRequests(apiKeyId: string, orgId: string): Promise<void> {
    await this.recordRequest(apiKeyId, "key");
    await this.recordRequest(orgId, "org");
  }

  /**
   * Reset limits for a specific identifier (useful for testing or admin override)
   */
  async resetLimit(identifier: string, type: "key" | "org"): Promise<void> {
    const limitsMap = type === "key" ? this.keyLimits : this.orgLimits;
    limitsMap.delete(identifier);
  }

  /**
   * Get current usage stats for an identifier
   */
  async getUsage(
    identifier: string,
    type: "key" | "org",
  ): Promise<{
    count: number;
    resetAt: number;
  } | null> {
    const limitsMap = type === "key" ? this.keyLimits : this.orgLimits;
    const state = limitsMap.get(identifier);

    if (!state) {
      return null;
    }

    // Check if window has passed
    const now = Date.now();
    if (now >= state.resetAt) {
      return {
        count: 0,
        resetAt: state.resetAt,
      };
    }

    return {
      count: state.count,
      resetAt: state.resetAt,
    };
  }

  /**
   * Clean up expired entries (should be called periodically)
   */
  cleanup(): void {
    const now = Date.now();

    for (const [key, state] of this.keyLimits.entries()) {
      if (now >= state.resetAt) {
        this.keyLimits.delete(key);
      }
    }

    for (const [key, state] of this.orgLimits.entries()) {
      if (now >= state.resetAt) {
        this.orgLimits.delete(key);
      }
    }
  }
}

// Singleton instance
export const rateLimitService = new RateLimitService();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      rateLimitService.cleanup();
    },
    5 * 60 * 1000,
  );
}
