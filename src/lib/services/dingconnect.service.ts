/**
 * DingConnect API Service
 * Handles all interactions with the DingConnect API
 * Documentation: https://www.dingconnect.com/Api
 */

interface DingConnectConfig {
  apiKey: string;
  baseUrl?: string;
}

interface DingConnectProduct {
  SkuCode: string;
  ProductId: number;
  ProviderCode: string;
  CountryIso: string;
  RegionCode: string;
  LocalizationKey: string;
  DefaultDisplayText: string;
  BenefitTypes: {
    Airtime?: {
      CurrencyCode: string;
      CurrencySymbol: string;
      Amount: number;
    };
    Data?: {
      Unit: string;
      Amount: number;
    };
  };
  ValidityPeriodIso?: string;
  Price: {
    CurrencyCode: string;
    CurrencySymbol: string;
    Amount: number;
  };
  ReceiveValue: {
    CurrencyCode: string;
    CurrencySymbol: string;
    Amount: number;
  };
}

interface DingConnectProvider {
  ProviderCode: string;
  ProviderName: string;
  CountryIso: string;
  RegionCode: string;
  LogoUrl?: string;
  CurrencyCode: string;
}

interface DingConnectBalance {
  AccountBalance: number;
  CurrencyCode: string;
}

interface SendTransferRequest {
  SkuCode: string;
  SendValue?: number;
  ReceiveValue?: number;
  ReceiveCurrencyIso?: string;
  AccountNumber: string;
  ValidateOnly?: boolean;
  DistributorRef?: string;
}

interface SendTransferResponse {
  TransferId: number;
  Status: 'Completed' | 'Processing' | 'Failed';
  ProviderTransactionId?: string;
  ErrorMessage?: string;
  ErrorCode?: string;
}

export class DingConnectService {
  private config: DingConnectConfig;
  private baseUrl: string;

  constructor(config: DingConnectConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.dingconnect.com';
  }

  /**
   * Make authenticated request to DingConnect API
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'api_key': this.config.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`DingConnect API Error: ${error.message || response.statusText}`);
    }

    const data = await response.json();

    // DingConnect wraps responses in { ResultCode, ErrorCodes, Items } structure
    // Extract the Items array if it exists
    if (data && typeof data === 'object' && 'Items' in data) {
      return data.Items as T;
    }

    return data;
  }

  /**
   * Get account balance
   * GET /api/V1/GetBalance
   */
  async getBalance(): Promise<DingConnectBalance> {
    const response: any = await this.request('/api/V1/GetBalance');
    // GetBalance returns the balance directly, not wrapped in Items
    // But it might have AccountBalance at root level
    if (response && 'AccountBalance' in response) {
      return response as DingConnectBalance;
    }
    // If wrapped, extract first item
    if (Array.isArray(response) && response.length > 0) {
      return response[0];
    }
    return response;
  }

  /**
   * Get list of available products
   * GET /api/V1/GetProducts
   */
  async getProducts(params?: {
    providerCode?: string;
    countryIso?: string;
    regionCode?: string;
  }): Promise<DingConnectProduct[]> {
    const query = new URLSearchParams();
    if (params?.providerCode) query.append('ProviderCode', params.providerCode);
    if (params?.countryIso) query.append('CountryIso', params.countryIso);
    if (params?.regionCode) query.append('RegionCode', params.regionCode);

    const queryString = query.toString();
    const endpoint = queryString ? `/api/V1/GetProducts?${queryString}` : '/api/V1/GetProducts';

    return this.request<DingConnectProduct[]>(endpoint);
  }

  /**
   * Get list of available providers/operators
   * GET /api/V1/GetProviders
   */
  async getProviders(params?: {
    countryIso?: string;
    regionCode?: string;
  }): Promise<DingConnectProvider[]> {
    const query = new URLSearchParams();
    if (params?.countryIso) query.append('CountryIso', params.countryIso);
    if (params?.regionCode) query.append('RegionCode', params.regionCode);

    const queryString = query.toString();
    const endpoint = queryString ? `/api/V1/GetProviders?${queryString}` : '/api/V1/GetProviders';

    return this.request<DingConnectProvider[]>(endpoint);
  }

  /**
   * Estimate prices for send or receive values
   * POST /api/V1/EstimatePrices
   */
  async estimatePrices(params: {
    skuCode: string;
    sendValue?: number;
    receiveValue?: number;
    receiveCurrencyIso?: string;
  }): Promise<{
    SkuCode: string;
    SendValue: number;
    ReceiveValue: number;
    Fee: number;
  }> {
    return this.request('/api/V1/EstimatePrices', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Send a transfer/top-up
   * POST /api/V1/SendTransfer
   */
  async sendTransfer(params: SendTransferRequest): Promise<SendTransferResponse> {
    return this.request<SendTransferResponse>('/api/V1/SendTransfer', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Validate a transfer without actually sending it
   */
  async validateTransfer(params: Omit<SendTransferRequest, 'ValidateOnly'>): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      await this.sendTransfer({
        ...params,
        ValidateOnly: true,
      });
      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Lookup account/operator for a phone number
   * GET /api/V1/GetAccountLookup
   */
  async lookupAccount(params: {
    accountNumber: string;
    countryIso?: string;
    providerCode?: string;
  }): Promise<{
    AccountNumber: string;
    CountryIso: string;
    ProviderCode: string;
    ProviderName?: string;
  }> {
    const query = new URLSearchParams();
    query.append('AccountNumber', params.accountNumber);
    if (params.countryIso) query.append('CountryIso', params.countryIso);
    if (params.providerCode) query.append('ProviderCode', params.providerCode);

    return this.request(`/api/V1/GetAccountLookup?${query.toString()}`);
  }

  /**
   * Test the connection to DingConnect
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

/**
 * Create a DingConnect service instance from integration credentials
 */
export function createDingConnectService(credentials: { apiKey: string }): DingConnectService {
  return new DingConnectService({
    apiKey: credentials.apiKey,
  });
}
