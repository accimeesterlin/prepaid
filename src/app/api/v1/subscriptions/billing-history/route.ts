import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { Organization } from "@pg-prepaid/db";
import { getTierInfo, SubscriptionTier } from "@/lib/pricing";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";

/**
 * GET /api/v1/subscriptions/billing-history
 * Returns the organization's subscription payment history, newest first.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const organization = await Organization.findById(user.orgId);
    if (!organization) {
      return createErrorResponse("Organization not found", 404);
    }

    const history = (organization.subscription?.paymentHistory || [])
      // Sort newest first
      .sort(
        (a, b) =>
          new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
      )
      .map((entry) => {
        const tierInfo = getTierInfo(entry.tier as SubscriptionTier);
        return {
          orderId: entry.orderId,
          tier: entry.tier,
          tierName: tierInfo.name,
          amount: entry.amount,
          months: entry.months,
          status: entry.status,
          paidAt: entry.paidAt,
          description: `${tierInfo.name} Plan — ${entry.months} Month${entry.months > 1 ? "s" : ""} Prepaid`,
        };
      });

    return createSuccessResponse({ history });
  } catch (error) {
    console.error("Error fetching billing history:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
