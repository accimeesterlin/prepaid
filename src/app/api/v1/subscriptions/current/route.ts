import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { Organization } from "@pg-prepaid/db";
import { getTierInfo, checkLimit, SubscriptionTier } from "@/lib/pricing";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Get organization
    const organization = await Organization.findById(user.orgId);
    if (!organization) {
      return createErrorResponse("Organization not found", 404);
    }

    // Get tier info
    const tier =
      (organization.subscriptionTier as SubscriptionTier) ||
      SubscriptionTier.STARTER;
    const tierInfo = getTierInfo(tier);

    // Calculate usage limits
    const transactionLimit = checkLimit(
      tier,
      "maxTransactionsPerMonth",
      organization.usage?.transactionsThisMonth || 0,
    );

    const teamMemberLimit = checkLimit(
      tier,
      "maxTeamMembers",
      organization.usage?.teamMembersUsed || 0,
    );

    const organizationLimit = checkLimit(
      tier,
      "maxOrganizations",
      organization.usage?.organizationsUsed || 0,
    );

    // Prepare response
    const subscriptionData = {
      tier,
      tierName: tierInfo.name,
      status: organization.subscription?.status || "active",
      monthlyFee: tierInfo.features.monthlyFee,
      transactionFeePercentage:
        organization.transactionFeePercentage ||
        tierInfo.features.transactionFeePercentage,
      currentPeriodStart:
        organization.subscription?.currentPeriodStart || new Date(),
      currentPeriodEnd:
        organization.subscription?.currentPeriodEnd ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usage: {
        transactions: organization.usage?.transactionsThisMonth || 0,
        transactionLimit: transactionLimit.limit,
        transactionRemaining: transactionLimit.remaining,
        teamMembers: organization.usage?.teamMembersUsed || 1,
        teamMemberLimit: teamMemberLimit.limit,
        teamMemberRemaining: teamMemberLimit.remaining,
        organizations: organization.usage?.organizationsUsed || 1,
        organizationLimit: organizationLimit.limit,
        organizationRemaining: organizationLimit.remaining,
      },
      features: tierInfo.features,
    };

    return createSuccessResponse(subscriptionData);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
