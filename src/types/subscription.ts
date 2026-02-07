import { SubscriptionTier } from "@/lib/pricing";

export interface SubscriptionUsage {
  transactions: number;
  transactionLimit: number | "unlimited";
  teamMembers: number;
  teamMemberLimit: number | "unlimited";
  organizations: number;
  organizationLimit: number | "unlimited";
}

export interface SubscriptionData {
  tier: SubscriptionTier;
  status: string;
  currentPeriodEnd: string;
  usage: SubscriptionUsage;
  monthlyFee: number;
  transactionFeePercentage: number;
}
