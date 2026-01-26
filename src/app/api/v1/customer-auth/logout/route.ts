/**
 * Customer Logout Endpoint
 * POST /api/v1/customer-auth/logout
 */

import { NextRequest } from "next/server";
import { createSuccessResponse } from "@/lib/api-response";
import { deleteCustomerSession } from "@/lib/customer-auth";

export async function POST(request: NextRequest) {
  await deleteCustomerSession();

  return createSuccessResponse({
    message: "Logout successful",
  });
}
