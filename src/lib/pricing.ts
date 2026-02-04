/**
 * Pricing Tier Configuration
 * Defines all subscription tiers, features, and limits for the platform
 */

export enum SubscriptionTier {
  STARTER = "starter",
  GROWTH = "growth",
  SCALE = "scale",
  ENTERPRISE = "enterprise",
}

export interface TierFeatures {
  // Organizational limits
  maxOrganizations: number | "unlimited";
  maxTeamMembers: number | "unlimited";
  maxTransactionsPerMonth: number | "unlimited";

  // Pricing
  transactionFeePercentage: number;
  monthlyFee: number;

  // Features
  whiteLabel: boolean | "partial";
  customDomain: boolean;
  apiAccess: boolean;
  webhooks: boolean | "advanced";
  zapier: boolean;
  advancedDiscounts: boolean;
  staffPortal: boolean | "limited";
  priorityProcessing: boolean;
  auditLogs: boolean;
  multiLanguage: boolean | "full";
  dedicatedSupport: boolean;

  // Marketing & Analytics
  advancedAnalytics: boolean;
  marketingIntegrations: boolean;

  // Security & Access
  rbac: boolean;
  apiRateLimit: number; // requests per minute
  testMode: boolean;
}

export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  [SubscriptionTier.STARTER]: {
    maxOrganizations: 1,
    maxTeamMembers: 1,
    maxTransactionsPerMonth: 200,
    transactionFeePercentage: 4.0,
    monthlyFee: 0,
    whiteLabel: false,
    customDomain: false,
    apiAccess: false,
    webhooks: false,
    zapier: false,
    advancedDiscounts: false,
    staffPortal: false,
    priorityProcessing: false,
    auditLogs: false,
    multiLanguage: false,
    dedicatedSupport: false,
    advancedAnalytics: false,
    marketingIntegrations: false,
    rbac: false,
    apiRateLimit: 10,
    testMode: true,
  },
  [SubscriptionTier.GROWTH]: {
    maxOrganizations: 3,
    maxTeamMembers: 5,
    maxTransactionsPerMonth: 3000,
    transactionFeePercentage: 2.0,
    monthlyFee: 149,
    whiteLabel: "partial",
    customDomain: false,
    apiAccess: true,
    webhooks: true,
    zapier: true,
    advancedDiscounts: false,
    staffPortal: "limited",
    priorityProcessing: false,
    auditLogs: false,
    multiLanguage: false,
    dedicatedSupport: false,
    advancedAnalytics: true,
    marketingIntegrations: true,
    rbac: true,
    apiRateLimit: 60,
    testMode: true,
  },
  [SubscriptionTier.SCALE]: {
    maxOrganizations: "unlimited",
    maxTeamMembers: "unlimited",
    maxTransactionsPerMonth: "unlimited",
    transactionFeePercentage: 1.0,
    monthlyFee: 499,
    whiteLabel: true,
    customDomain: true,
    apiAccess: true,
    webhooks: "advanced",
    zapier: true,
    advancedDiscounts: true,
    staffPortal: true,
    priorityProcessing: true,
    auditLogs: true,
    multiLanguage: "full",
    dedicatedSupport: false,
    advancedAnalytics: true,
    marketingIntegrations: true,
    rbac: true,
    apiRateLimit: 300,
    testMode: true,
  },
  [SubscriptionTier.ENTERPRISE]: {
    maxOrganizations: "unlimited",
    maxTeamMembers: "unlimited",
    maxTransactionsPerMonth: "unlimited",
    transactionFeePercentage: 0.5,
    monthlyFee: 1000,
    whiteLabel: true,
    customDomain: true,
    apiAccess: true,
    webhooks: "advanced",
    zapier: true,
    advancedDiscounts: true,
    staffPortal: true,
    priorityProcessing: true,
    auditLogs: true,
    multiLanguage: "full",
    dedicatedSupport: true,
    advancedAnalytics: true,
    marketingIntegrations: true,
    rbac: true,
    apiRateLimit: 1000,
    testMode: true,
  },
};

export interface TierInfo {
  tier: SubscriptionTier;
  name: string;
  description: string;
  features: TierFeatures;
  highlights: string[];
  cta: string;
}

export const TIER_INFO: Record<SubscriptionTier, Omit<TierInfo, "features">> = {
  [SubscriptionTier.STARTER]: {
    tier: SubscriptionTier.STARTER,
    name: "Launch",
    description: "Perfect for solo resellers testing the market",
    highlights: [
      "Global Mobile Top-Ups",
      "1 Organization",
      "Public Storefront",
      "Customer Portal",
      "Basic Analytics",
    ],
    cta: "Start Free",
  },
  [SubscriptionTier.GROWTH]: {
    tier: SubscriptionTier.GROWTH,
    name: "Business",
    description: "For real businesses selling daily",
    highlights: [
      "Up to 3 Organizations",
      "Up to 5 Team Members",
      "Partial White Label",
      "Customer API Access",
      "Full Analytics & Webhooks",
    ],
    cta: "Start Growth Plan",
  },
  [SubscriptionTier.SCALE]: {
    tier: SubscriptionTier.SCALE,
    name: "White Label Pro",
    description: "For fintechs and serious operations",
    highlights: [
      "Unlimited Organizations",
      "Unlimited Team Members",
      "Full White Label",
      "Custom Domain",
      "Priority Processing",
    ],
    cta: "Start Scale Plan",
  },
  [SubscriptionTier.ENTERPRISE]: {
    tier: SubscriptionTier.ENTERPRISE,
    name: "Infrastructure Partner",
    description: "For aggregators, telcos, and banks",
    highlights: [
      "Dedicated Infrastructure",
      "Custom Integrations",
      "SLA Contracts",
      "Dedicated Support",
      "Revenue Share Deals",
    ],
    cta: "Contact Sales",
  },
};

/**
 * Get full tier information including features
 */
export function getTierInfo(tier: SubscriptionTier): TierInfo {
  return {
    ...TIER_INFO[tier],
    features: TIER_FEATURES[tier],
  };
}

/**
 * Check if a feature is accessible for a given tier
 */
export function canAccessFeature(
  tier: SubscriptionTier,
  feature: keyof TierFeatures,
): boolean {
  const tierFeatures = TIER_FEATURES[tier];
  const featureValue = tierFeatures[feature];

  // Handle boolean and "partial"/"advanced" string values
  if (typeof featureValue === "boolean") {
    return featureValue;
  }

  if (typeof featureValue === "string") {
    return (
      featureValue === "partial" ||
      featureValue === "advanced" ||
      featureValue === "limited" ||
      featureValue === "full"
    );
  }

  return false;
}

/**
 * Check if a limit has been reached
 */
export function checkLimit(
  tier: SubscriptionTier,
  limitType: "maxOrganizations" | "maxTeamMembers" | "maxTransactionsPerMonth",
  currentValue: number,
): {
  allowed: boolean;
  limit: number | "unlimited";
  remaining: number | "unlimited";
} {
  const tierFeatures = TIER_FEATURES[tier];
  const limit = tierFeatures[limitType];

  if (limit === "unlimited") {
    return { allowed: true, limit: "unlimited", remaining: "unlimited" };
  }

  const allowed = currentValue < limit;
  const remaining = Math.max(0, limit - currentValue);

  return { allowed, limit, remaining };
}

/**
 * Calculate transaction fee for a given tier and amount
 */
export function calculateTransactionFee(
  tier: SubscriptionTier,
  amount: number,
): number {
  const tierFeatures = TIER_FEATURES[tier];
  return (amount * tierFeatures.transactionFeePercentage) / 100;
}

/**
 * Get the next tier in the upgrade path
 */
export function getNextTier(
  currentTier: SubscriptionTier,
): SubscriptionTier | null {
  const tierOrder = [
    SubscriptionTier.STARTER,
    SubscriptionTier.GROWTH,
    SubscriptionTier.SCALE,
    SubscriptionTier.ENTERPRISE,
  ];

  const currentIndex = tierOrder.indexOf(currentTier);
  if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
    return null;
  }

  return tierOrder[currentIndex + 1];
}

/**
 * Check if user is approaching a limit (80% threshold)
 */
export function isApproachingLimit(
  tier: SubscriptionTier,
  limitType: "maxOrganizations" | "maxTeamMembers" | "maxTransactionsPerMonth",
  currentValue: number,
): boolean {
  const tierFeatures = TIER_FEATURES[tier];
  const limit = tierFeatures[limitType];

  if (limit === "unlimited") {
    return false;
  }

  return currentValue >= limit * 0.8;
}

/**
 * Get all tier names in order
 */
export function getAllTiers(): SubscriptionTier[] {
  return [
    SubscriptionTier.STARTER,
    SubscriptionTier.GROWTH,
    SubscriptionTier.SCALE,
    SubscriptionTier.ENTERPRISE,
  ];
}
