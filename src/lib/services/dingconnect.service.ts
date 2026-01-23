/**
 * DingConnect API Service
 * Handles all interactions with the DingConnect API
 * Documentation: https://www.dingconnect.com/Api
 */

interface DingConnectConfig {
  apiKey: string;
  baseUrl?: string;
}

interface DingConnectBenefitValue {
  CurrencyCode?: string;
  CurrencySymbol?: string;
  Amount: number;
  Unit?: string;
}

interface DingConnectPrice {
  CurrencyCode: string;
  CurrencySymbol: string;
  Amount: number;
}

interface DingConnectMinMax {
  SendValue: number;
  SendCurrencyIso: string;
  ReceiveValue: number;
  ReceiveCurrencyIso: string;
}

export interface DingConnectProduct {
  SkuCode: string;
  ProductId: number;
  ProviderCode: string;
  CountryIso: string;
  RegionCode: string;
  LocalizationKey: string;
  DefaultDisplayText: string;

  // Benefit Types (for fixed-value products)
  BenefitTypes?: {
    Airtime?: DingConnectBenefitValue;
    Data?: DingConnectBenefitValue;
    Voice?: DingConnectBenefitValue;
    SMS?: DingConnectBenefitValue;
  };

  // Benefits array (for variable-value products)
  Benefits?: string[];

  ValidityPeriodIso?: string;

  // Pricing (for fixed-value products)
  Price?: DingConnectPrice;
  ReceiveValue?: DingConnectPrice;

  // Min/Max (for variable-value products)
  Minimum?: DingConnectMinMax;
  Maximum?: DingConnectMinMax;
}

export interface DingConnectProvider {
  ProviderCode: string;
  ProviderName: string;
  CountryIso: string;
  RegionCode: string;
  LogoUrl?: string;
  CurrencyCode: string;
}

export interface DingConnectBalance {
  AccountBalance: number;
  CurrencyCode: string;
}

export interface SendTransferRequest {
  SkuCode: string;
  SendValue?: number;
  SendCurrencyIso?: string; // For variable-value products
  ReceiveValue?: number;
  ReceiveCurrencyIso?: string; // For fixed-value products
  AccountNumber: string;
  ValidateOnly?: boolean;
  DistributorRef?: string;
}

export interface SendTransferResponse {
  TransferId: number;
  Status: 'Completed' | 'Processing' | 'Failed';
  ProviderTransactionId?: string;
  ErrorMessage?: string;
  ErrorCode?: string;
}

export interface GetProvidersParams {
  countryIso?: string;
  regionCode?: string;
  accountNumber?: string;
}

export interface GetProductsParams {
  providerCode?: string;
  countryIso?: string;
  regionCode?: string;
  accountNumber?: string;
}

export interface LookupAccountParams {
  accountNumber: string;
  countryIso?: string;
  providerCode?: string;
}

export interface AccountLookupResponse {
  AccountNumber: string;
  CountryIso: string;
  ProviderCode: string;
  ProviderName?: string;
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

    const requestBody = options.body;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'api_key': this.config.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorDetails: any = { message: 'Unknown error' };
      let responseText = '';

      try {
        responseText = await response.text();
        errorDetails = JSON.parse(responseText);
      } catch (_e) {
        errorDetails = { message: responseText || response.statusText };
      }

      // Enhanced error with full details
      const errorMessage = [
        `DingConnect API Error: ${response.status} ${response.statusText}`,
        `URL: ${endpoint}`,
        `Request: ${requestBody || 'none'}`,
        `Response: ${JSON.stringify(errorDetails)}`,
        `Message: ${errorDetails.message || errorDetails.ErrorMessage || 'Unknown error'}`,
        errorDetails.ErrorCodes ? `Error Codes: ${JSON.stringify(errorDetails.ErrorCodes)}` : '',
      ].filter(Boolean).join(' | ');

      throw new Error(errorMessage);
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
   * When accountNumber is provided, DingConnect will return products for the detected operator
   */
  async getProducts(params?: GetProductsParams): Promise<DingConnectProduct[]> {
    const query = new URLSearchParams();
    if (params?.providerCode) query.append('ProviderCode', params.providerCode);
    if (params?.countryIso) query.append('CountryIso', params.countryIso);
    if (params?.regionCode) query.append('RegionCode', params.regionCode);
    if (params?.accountNumber) query.append('AccountNumber', params.accountNumber);

    const queryString = query.toString();
    const endpoint = queryString ? `/api/V1/GetProducts?${queryString}` : '/api/V1/GetProducts';

    return this.request<DingConnectProduct[]>(endpoint);
  }

  /**
   * Get list of available providers/operators
   * GET /api/V1/GetProviders
   * When accountNumber is provided, DingConnect will return only the matching provider
   */
  async getProviders(params?: GetProvidersParams): Promise<DingConnectProvider[]> {
    const query = new URLSearchParams();
    if (params?.countryIso) query.append('CountryIso', params.countryIso);
    if (params?.regionCode) query.append('RegionCode', params.regionCode);
    if (params?.accountNumber) query.append('AccountNumber', params.accountNumber);

    const queryString = query.toString();
    const endpoint = queryString ? `/api/V1/GetProviders?${queryString}` : '/api/V1/GetProviders';

    return this.request<DingConnectProvider[]>(endpoint);
  }

  /**
   * Estimate prices for send or receive values
   * POST /api/V1/EstimatePrices
   * Accepts array of estimation requests
   */
  async estimatePrices(params: Array<{
    SkuCode: string;
    SendValue?: number;
    SendCurrencyIso?: string;
    ReceiveValue?: number;
    ReceiveCurrencyIso?: string;
    BatchItemRef?: string;
  }>): Promise<Array<{
    SkuCode: string;
    SendValue: number;
    SendCurrencyIso: string;
    ReceiveValue: number;
    ReceiveCurrencyIso: string;
    Fee: number;
    BatchItemRef?: string;
    Price?: {
      CustomerFee: number;
      DistributorFee: number;
      ReceiveValue: number;
      ReceiveCurrencyIso: string;
      ReceiveValueExcludingTax: number;
      TaxRate: number;
      SendValue: number;
      SendCurrencyIso: string;
    };
  }>> {
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
   * Get transfer status
   * GET /api/V1/GetTransferStatus
   */
  async getTransferStatus(transferId: number): Promise<SendTransferResponse> {
    return this.request<SendTransferResponse>(`/api/V1/GetTransferStatus?TransferId=${transferId}`);
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
  async lookupAccount(params: LookupAccountParams): Promise<AccountLookupResponse> {
    const query = new URLSearchParams();
    query.append('AccountNumber', params.accountNumber);
    if (params.countryIso) query.append('CountryIso', params.countryIso);
    if (params.providerCode) query.append('ProviderCode', params.providerCode);

    return this.request<AccountLookupResponse>(`/api/V1/GetAccountLookup?${query.toString()}`);
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
