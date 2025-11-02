import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { createSuccessResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api-error';
import { dbConnection } from '@pg-prepaid/db/connection';
import { UserOrganization } from '@pg-prepaid/db';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    await dbConnection.connect();

    // Get user's organization membership to include balance info
    const userOrg = await UserOrganization.findOne({
      userId: session.userId,
      orgId: session.orgId,
      isActive: true,
    });

    return createSuccessResponse({
      id: session.userId,
      email: session.email,
      roles: session.roles,
      orgId: session.orgId,
      balanceLimit: userOrg?.balanceLimit || null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
