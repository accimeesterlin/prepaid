import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth-middleware';
import { Customer } from '@/packages/db';
import { ApiResponse } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';
import { z } from 'zod';

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { customer } = await requireCustomerAuth(request);

    // Ensure customer can only update their own password
    if (customer._id.toString() !== id) {
      throw ApiError.forbidden('You can only update your own password');
    }

    const body = await request.json();
    const { currentPassword, newPassword } = updatePasswordSchema.parse(body);

    // Verify current password
    const isValid = await customer.comparePassword(currentPassword);
    if (!isValid) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    // Update password
    customer.passwordHash = newPassword; // Will be hashed by pre-save hook
    await customer.save();

    return ApiResponse.success(null, {
      message: 'Password updated successfully',
    });
  } catch (error: any) {
    return ApiError.handle(error);
  }
}
