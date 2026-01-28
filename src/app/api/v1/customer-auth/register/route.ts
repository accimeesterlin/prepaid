/**
 * Customer Registration Endpoint
 * POST /api/v1/customer-auth/register
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { Customer } from "@pg-prepaid/db";
import { Org } from "@pg-prepaid/db";
import { ApiErrors } from "@/lib/api-error";
import {
  createSuccessResponse,
  createCreatedResponse,
} from "@/lib/api-response";
import { createCustomerSession } from "@/lib/customer-auth";
import { emailVerificationService } from "@/lib/services/email-verification.service";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").optional(),
  phoneNumber: z.string().min(10, "Phone number is required"),
  orgSlug: z.string().min(1, "Organization slug is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Find organization by slug
    const org = await Org.findOne({ slug: data.orgSlug.toLowerCase() });

    if (!org) {
      throw ApiErrors.NotFound("Organization not found");
    }

    // Check if customer already exists with this email in this org
    const existingCustomer = await Customer.findOne({
      email: data.email.toLowerCase(),
      orgId: org._id.toString(),
    });

    if (existingCustomer) {
      throw ApiErrors.BadRequest("An account with this email already exists");
    }

    // Create customer
    const customer = await Customer.create({
      orgId: org._id.toString(),
      email: data.email.toLowerCase(),
      passwordHash: data.password, // Will be hashed by pre-save hook
      name: data.name,
      phoneNumber: data.phoneNumber,
      emailVerified: false,
      currentBalance: 0,
      totalAssigned: 0,
      totalUsed: 0,
      balanceCurrency: org.settings?.currency || "USD",
      metadata: {
        totalPurchases: 0,
        totalSpent: 0,
        currency: org.settings?.currency || "USD",
      },
    });

    // Send verification email
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    await emailVerificationService.sendVerificationEmail(
      customer,
      data.orgSlug,
      baseUrl,
    );

    // Create session (but user needs to verify email before using balance)
    await createCustomerSession({
      customerId: String(customer._id),
      orgId: String(org._id),
      email: customer.email!,
      emailVerified: false,
      name: customer.name,
    });

    return createCreatedResponse({
      message:
        "Account created successfully. Please check your email to verify your account.",
      customer: {
        id: String(customer._id),
        email: customer.email,
        name: customer.name,
        emailVerified: false,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ApiErrors.BadRequest(error.errors[0].message);
    }
    throw error;
  }
}
