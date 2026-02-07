import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { Organization } from "@pg-prepaid/db";
import { getTierInfo, checkLimit, SubscriptionTier } from "@/lib/pricing";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    console.log("User session:", {
      userId: user.userId,
      email: user.email,
      orgId: user.orgId,
    });

    // Get organization
    const organization = await Organization.findById(user.orgId);

    if (!organization) {
      console.error("Organization not found for orgId:", user.orgId);

      // Check if any organizations exist
      const orgCount = await Organization.countDocuments();
      console.log("Total organizations in database:", orgCount);

      return createErrorResponse(
        `Organization not found. User orgId: ${user.orgId}. Please contact support.`,
        404,
      );
    }

    // Determine effective tier
    const validTiers = Object.values(SubscriptionTier);

    let tier =
      (organization.subscriptionTier as SubscriptionTier) ||
      SubscriptionTier.STARTER;

    // If there's completed payment history with a valid tier, prefer the
    // most recent completed tier. This helps auto-heal cases where
    // subscriptionTier wasn't updated correctly but paymentHistory was.
    const history = organization.subscription?.paymentHistory || [];
    const lastCompleted = [...history]
      .reverse()
      .find(
        (entry) =>
          entry.status === "completed" &&
          validTiers.includes(entry.tier as SubscriptionTier),
      );

    if (lastCompleted) {
      const historyTier = lastCompleted.tier as SubscriptionTier;
      if (tier !== historyTier) {
        tier = historyTier;
        // Best-effort sync back to the database; ignore errors so
        // they don't break the response.
        try {
          await Organization.findByIdAndUpdate(organization._id, {
            subscriptionTier: historyTier,
          });
        } catch (syncError) {
          console.error(
            "Failed to sync subscriptionTier from payment history",
            syncError,
          );
        }
      }
    }
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
      // Debug fields to help diagnose tier mismatches
      debug: {
        rawSubscriptionTier: organization.subscriptionTier,
        lastCompletedPaymentTier:
          (lastCompleted?.tier as SubscriptionTier) || null,
        paymentHistoryCount: history.length,
      },
    };

    return createSuccessResponse(subscriptionData);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
