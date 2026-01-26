import { NextRequest, NextResponse } from "next/server";
import { requireCustomerAuth } from "@/lib/auth-middleware";
import { Transaction } from "@/packages/db";
import { ApiResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { customer } = await requireCustomerAuth(request);

    // Ensure customer can only access their own transactions
    if (customer._id.toString() !== id) {
      throw ApiError.forbidden("You can only view your own transactions");
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
      Transaction.find({ customerId: customer._id })
        .populate("productId", "name country")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments({ customerId: customer._id }),
    ]);

    return ApiResponse.success(transactions, {
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
    return ApiError.handle(error);
  }
}
