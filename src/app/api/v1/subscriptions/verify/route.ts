import { NextRequest } from "next/server";
import { Organization } from "@pg-prepaid/db";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { PGPayService } from "@/lib/services/pgpay.service";

/**
 * Verify subscription payment status
 * Called by the frontend after payment redirect
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, pgPayToken } = body;

    console.log("Verifying subscription payment:", {
      orderId,
      token: pgPayToken?.substring(0, 10) + "...",
    });

    if (!orderId) {
      return createErrorResponse("Order ID is required", 400);
    }

    // Find organization with this order
    const organization = await Organization.findOne({
      $or: [
        { "subscription.pendingUpgrade.orderId": orderId },
        { "subscription.lastPayment.orderId": orderId },
      ],
    });

    if (!organization) {
      console.error("Organization not found for orderId:", orderId);
      return createErrorResponse("Subscription not found", 404);
    }

    // Check if already processed
    if (
      organization.subscription?.lastPayment?.orderId === orderId &&
      organization.subscription?.lastPayment?.status === "completed"
    ) {
      console.log("Payment already processed successfully");
      return createSuccessResponse({
        status: "completed",
        tier: organization.subscriptionTier,
        currentPeriodEnd: organization.subscription.currentPeriodEnd,
        prepaidMonths: organization.subscription.prepaidMonths,
        message: "Subscription activated successfully",
      });
    }

    // Check if still pending
    const pendingUpgrade = organization.subscription?.pendingUpgrade;
    if (!pendingUpgrade || pendingUpgrade.orderId !== orderId) {
      return createErrorResponse(
        "Payment is being processed. Please wait a moment and refresh.",
        202
      );
    }

    // Verify with PGPay if token provided
    if (pgPayToken) {
      const pgPayUserId = process.env.PGPAY_USER_ID;
      const pgPayEnvironment =
        (process.env.PGPAY_ENVIRONMENT as "sandbox" | "production") ||
        "sandbox";

      if (!pgPayUserId) {
        console.error("PGPAY_USER_ID not configured");
        return createErrorResponse("Payment service not configured", 500);
      }

      const pgPayService = new PGPayService({
        userId: pgPayUserId,
        environment: pgPayEnvironment,
      });

      try {
        const verification = await pgPayService.verifyPayment({ pgPayToken });

        if (verification.status === "completed") {
          // Payment is verified - trigger webhook processing manually if needed
          console.log("Payment verified as completed, triggering processing");

          const months = pendingUpgrade.months || 1;
          const daysToAdd = months * 30;

          // Update organization subscription
          await Organization.findByIdAndUpdate(organization._id, {
            subscriptionTier: pendingUpgrade.tier,
            "subscription.status": "active",
            "subscription.currentPeriodStart": new Date(),
            "subscription.currentPeriodEnd": new Date(
              Date.now() + daysToAdd * 24 * 60 * 60 * 1000
            ),
            "subscription.prepaidMonths": months,
            "subscription.lastPayment": {
              orderId,
              amount: verification.amount,
              months,
              status: "completed",
              paidAt: new Date(),
            },
            $unset: { "subscription.pendingUpgrade": "" },
          });

          console.log(
            "Subscription activated:",
            pendingUpgrade.tier,
            "for",
            months,
            "months"
          );

          return createSuccessResponse({
            status: "completed",
            tier: pendingUpgrade.tier,
            currentPeriodEnd: new Date(
              Date.now() + daysToAdd * 24 * 60 * 60 * 1000
            ),
            prepaidMonths: months,
            message: "Subscription activated successfully",
          });
        }
      } catch (error: any) {
        console.error("PGPay verification failed:", error);
        // Continue to return pending status
      }
    }

    // Still pending
    return createSuccessResponse({
      status: "pending",
      message: "Payment is being processed. Please wait...",
    });
  } catch (error: any) {
    console.error("Error verifying subscription payment:", error);
    return createErrorResponse(
      error.message || "Failed to verify subscription payment",
      500
    );
  }
}
