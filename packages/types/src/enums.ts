export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}

export enum Permission {
  // Dashboard & Analytics
  VIEW_DASHBOARD = 'view_dashboard',
  VIEW_ANALYTICS = 'view_analytics',

  // Storefront
  VIEW_STOREFRONT_SETTINGS = 'view_storefront_settings',
  EDIT_STOREFRONT_SETTINGS = 'edit_storefront_settings',

  // Products & Pricing
  VIEW_PRODUCTS = 'view_products',
  EDIT_PRODUCTS = 'edit_products',
  SYNC_PRODUCTS = 'sync_products',
  VIEW_PRICING = 'view_pricing',
  EDIT_PRICING = 'edit_pricing',

  // Discounts
  VIEW_DISCOUNTS = 'view_discounts',
  CREATE_DISCOUNTS = 'create_discounts',
  EDIT_DISCOUNTS = 'edit_discounts',
  DELETE_DISCOUNTS = 'delete_discounts',

  // Countries
  VIEW_COUNTRIES = 'view_countries',
  EDIT_COUNTRIES = 'edit_countries',

  // Transactions
  VIEW_TRANSACTIONS = 'view_transactions',
  PROCESS_TRANSACTIONS = 'process_transactions',
  REFUND_TRANSACTIONS = 'refund_transactions',

  // Customers
  VIEW_CUSTOMERS = 'view_customers',
  EDIT_CUSTOMERS = 'edit_customers',

  // Team
  VIEW_TEAM = 'view_team',
  INVITE_TEAM = 'invite_team',
  EDIT_TEAM = 'edit_team',
  REMOVE_TEAM = 'remove_team',

  // Integrations
  VIEW_INTEGRATIONS = 'view_integrations',
  EDIT_INTEGRATIONS = 'edit_integrations',

  // Payment Settings
  VIEW_PAYMENT_SETTINGS = 'view_payment_settings',
  EDIT_PAYMENT_SETTINGS = 'edit_payment_settings',

  // Wallet
  VIEW_WALLET = 'view_wallet',
  DEPOSIT_WALLET = 'deposit_wallet',
  EDIT_WALLET_SETTINGS = 'edit_wallet_settings',

  // Organization Settings
  VIEW_ORG_SETTINGS = 'view_org_settings',
  EDIT_ORG_SETTINGS = 'edit_org_settings',
}

export enum TransactionStatus {
  CREATED = 'created',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_AUTHORIZED = 'payment_authorized',
  PAYMENT_FAILED = 'payment_failed',
  SENT = 'sent',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  PGPAY = 'pgpay',
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum WebhookEventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  TOPUP_REQUEST = 'topup_request',
  TOPUP_SUCCESS = 'topup_success',
  TOPUP_FAILURE = 'topup_failure',
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_COMPLETED = 'payment_completed',
  REFUND_INITIATED = 'refund_initiated',
  REFUND_COMPLETED = 'refund_completed',
}
