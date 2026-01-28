import { NextRequest } from "next/server";
import { requireCustomerAuth } from "@/lib/auth-middleware";
import { Transaction } from "@pg-prepaid/db";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { ApiErrors } from "@/lib/api-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await requireCustomerAuth(request);

    // Ensure customer can only access their own transactions
    if (session.customerId !== id) {
      return createErrorResponse(
        ApiErrors.Forbidden("You can only access your own transactions"),
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20", 10),
      100,
    );
    const skip = (page - 1) * limit;

    // Get transactions for this customer
    const [transactions, total] = await Promise.all([
      Transaction.find({ customerId: session.customerId })
        .populate("productId", "name country")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments({ customerId: session.customerId }),
    ]);

    return createSuccessResponse({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    return createErrorResponse(
      ApiErrors.Internal(error.message || "Failed to fetch transactions"),
    );
  }
}
