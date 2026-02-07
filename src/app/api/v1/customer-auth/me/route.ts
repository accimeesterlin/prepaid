/**
 * Get Current Customer Session
 * GET /api/v1/customer-auth/me
 */

import { NextRequest } from "next/server";
import { Customer } from "@pg-prepaid/db";
import { dbConnection } from "@pg-prepaid/db/connection";
import { ApiErrors, handleApiError } from "@/lib/api-error";
import { createSuccessResponse } from "@/lib/api-response";
import { requireCustomerAuthOrApiKey } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    await dbConnection.connect();

    const session = await requireCustomerAuthOrApiKey(request);

    // Get full customer details
    const customer = await Customer.findById(session.customerId);

    if (!customer) {
      throw ApiErrors.NotFound("Customer not found");
    }

    return createSuccessResponse({
      customer: {
        _id: String(customer._id),
        email: customer.email,
        firstName: customer.name || "", // Use name field as firstName for now
        lastName: "", // No lastName in schema
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
  } catch (error) {
    return handleApiError(error);
  }
}
