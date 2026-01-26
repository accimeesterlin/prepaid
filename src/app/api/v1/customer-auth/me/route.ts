/**
 * Get Current Customer Session
 * GET /api/v1/customer-auth/me
 */

import { NextRequest } from "next/server";
import { Customer } from "@pg-prepaid/db";
import { ApiErrors } from "@/lib/api-error";
import { createSuccessResponse } from "@/lib/api-response";
import { requireCustomerAuth } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  const session = await requireCustomerAuth(request);

  // Get full customer details
  const customer = await Customer.findById(session.customerId);

  if (!customer) {
    throw ApiErrors.NotFound("Customer not found");
  }

  return createSuccessResponse({
    customer: {
      id: customer._id.toString(),
      email: customer.email,
      name: customer.name,
      phoneNumber: customer.phoneNumber,
      emailVerified: customer.emailVerified,
      currentBalance: customer.currentBalance,
      totalAssigned: customer.totalAssigned,
      totalUsed: customer.totalUsed,
      balanceCurrency: customer.balanceCurrency,
      country: customer.country,
      createdAt: customer.createdAt,
    },
  });
}
