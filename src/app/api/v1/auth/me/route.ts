import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { createSuccessResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    return createSuccessResponse({
      id: session.userId,
      email: session.email,
      roles: session.roles,
      orgId: session.orgId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
