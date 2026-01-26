import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { Transaction } from "@/packages/db";
import { ApiResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  try {
    const { session } = await requireAuth(request);

    // Get query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20", 10),
      100,
    );
    const skip = (page - 1) * limit;

    // Get transactions created by this user
    const [transactions, total] = await Promise.all([
      Transaction.find({ createdBy: session.userId })
        .populate("productId", "name country")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments({ createdBy: session.userId }),
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
