/**
 * Resend Verification Email Endpoint
 * POST /api/v1/customer-auth/resend-verification
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { Customer } from "@pg-prepaid/db";
import { Org } from "@pg-prepaid/db";
import { dbConnection } from "@pg-prepaid/db/connection";
import { ApiErrors } from "@/lib/api-error";
import { createSuccessResponse } from "@/lib/api-response";
import { emailVerificationService } from "@/lib/services/email-verification.service";

const resendSchema = z.object({
  email: z.string().email("Invalid email address"),
  orgSlug: z.string().min(1, "Organization slug is required"),
});

export async function POST(request: NextRequest) {
  try {
    await dbConnection.connect();

    const body = await request.json();
    const data = resendSchema.parse(body);

    // Find organization by slug
    const org = await Org.findOne({ slug: data.orgSlug.toLowerCase() });

    if (!org) {
      throw ApiErrors.NotFound("Organization not found");
    }

    // Find customer
    const customer = await Customer.findOne({
      email: data.email.toLowerCase(),
      orgId: org._id.toString(),
    });

    if (!customer) {
      // Don't reveal if customer exists or not for security
      return createSuccessResponse({
        message:
          "If an account exists with this email, a verification email has been sent.",
      });
    }

    if (customer.emailVerified) {
      throw ApiErrors.BadRequest("Email is already verified");
    }

    // Send verification email
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const result = await emailVerificationService.sendVerificationEmail(
      customer,
      data.orgSlug,
      baseUrl,
    );

    if (!result.success) {
      throw ApiErrors.BadRequest(
        result.error || "Failed to send verification email",
      );
    }

    return createSuccessResponse({
      message: "Verification email sent successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ApiErrors.BadRequest(error.errors[0].message);
    }
    throw error;
  }
}
