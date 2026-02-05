/**
 * Reloadly API Service
 * Handles all interactions with the Reloadly top-ups API.
 * Authentication is OAuth2 client-credentials; a token is obtained once per
 * service instance and reused until it expires.
 *
 * Docs: https://developers.reloadly.com
 */

// ---------------------------------------------------------------------------
// Config & credential types
// ---------------------------------------------------------------------------

export interface ReloadlyConfig {
  clientId: string;
  clientSecret: string;
  /** 'sandbox' | 'production'  (default: 'production') */
  environment?: 'sandbox' | 'production';
}

// ---------------------------------------------------------------------------
// Raw API response types
// ---------------------------------------------------------------------------

/** OAuth token response from https://auth.reloadly.com/oauth/token */
interface ReloadlyTokenResponse {
  access_token: string;
  token_type: string;
  /** Seconds until expiry */
  expires_in: number;
}

/** GET /accounts/balance response */
interface ReloadlyBalanceResponse {
  balance: number;
  currencyCode: string;
}

// ---------------------------------------------------------------------------
// Normalised types (consumed by the rest of the app)
// ---------------------------------------------------------------------------

/** Balance object shape shared across provider services. */
export interface ReloadlyBalance {
  AccountBalance: number;
  CurrencyCode: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/** Base URLs keyed by environment. */
const BASE_URLS: Record<string, string> = {
  sandbox: 'https://topups-sandbox.reloadly.com',
  production: 'https://topups.reloadly.com',
};

const AUTH_URL = 'https://auth.reloadly.com/oauth/token';

export class ReloadlyService {
  private config: ReloadlyConfig;
  private baseUrl: string;

  /** Cached token + the absolute timestamp (ms) at which it expires. */
  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(config: ReloadlyConfig) {
    this.config = config;
    this.baseUrl = BASE_URLS[config.environment || 'production'];
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Obtain (or reuse a cached) OAuth bearer token.
   * Reloadly tokens expire; we request a fresh one when the cached one is
   * within 60 seconds of expiry.
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    // Reuse cached token if still valid (with 60 s buffer)
    if (this.cachedToken && now < this.tokenExpiresAt - 60_000) {
      return this.cachedToken;
    }

    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'client_credentials',
        audience: this.baseUrl,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Reloadly auth failed (${response.status}): ${text || response.statusText}`,
      );
    }

    const tokenData: ReloadlyTokenResponse = await response.json();
    this.cachedToken = tokenData.access_token;
    this.tokenExpiresAt = now + tokenData.expires_in * 1000;

    return this.cachedToken;
  }

  /**
   * Generic authenticated GET against the Reloadly API.
   */
  private async request<T>(path: string): Promise<T> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Reloadly API error (${response.status}) ${path}: ${text || response.statusText}`,
      );
    }

    return response.json() as Promise<T>;
  }

  // -----------------------------------------------------------------------
  // Public methods
  // -----------------------------------------------------------------------

  /**
   * Fetch the account balance.
   * GET /accounts/balance
   *
   * Maps the Reloadly response ({ balance, currencyCode }) to the normalised
   * ReloadlyBalance shape ({ AccountBalance, CurrencyCode }) so that the
   * dashboard route can treat DingConnect and Reloadly uniformly.
   */
  async getBalance(): Promise<ReloadlyBalance> {
    const data = await this.request<ReloadlyBalanceResponse>('/accounts/balance');

    return {
      AccountBalance: Number(data.balance) || 0,
      CurrencyCode: data.currencyCode || 'USD',
    };
  }

  /**
   * Quick smoke-test: authenticate and fetch balance.
   * Used by the integration-test endpoint.
   */
  async testConnection(): Promise<{
    success: boolean;
    balance?: number;
    currency?: string;
    error?: string;
  }> {
    try {
      const balance = await this.getBalance();
      return {
        success: true,
        balance: balance.AccountBalance,
        currency: balance.CurrencyCode,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/**
 * Factory helper — mirrors createDingConnectService pattern.
 */
export function createReloadlyService(credentials: {
  clientId: string;
  clientSecret: string;
}, environment?: 'sandbox' | 'production'): ReloadlyService {
  return new ReloadlyService({ clientId: credentials.clientId, clientSecret: credentials.clientSecret, environment });
}
