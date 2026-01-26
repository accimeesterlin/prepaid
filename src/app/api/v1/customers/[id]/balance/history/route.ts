import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { CustomerBalanceHistory } from "@/packages/db";
import { ApiResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth(request);
    const { id } = await params;

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50", 10),
      100,
    );

    // Get balance history for this customer
    const history = await CustomerBalanceHistory.find({ customerId: id })
      .populate("adminId", "name")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return ApiResponse.success(history);
  } catch (error: any) {
    return ApiError.handle(error);
  }
}
