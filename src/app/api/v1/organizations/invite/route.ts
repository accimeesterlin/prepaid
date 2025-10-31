import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-middleware';
import { dbConnection } from '@pg-prepaid/db/connection';
import { User, UserOrganization } from '@pg-prepaid/db';
import { UserRole } from '@pg-prepaid/types';
import { ApiErrors, handleApiError } from '@/lib/api-error';
import { createSuccessResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';

const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  roles: z
    .array(z.enum([UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER]))
    .min(1, 'At least one role is required')
    .default([UserRole.VIEWER]),
  orgId: z.string().optional(), // If not provided, use current org from session
});

/**
 * POST /api/v1/organizations/invite
 * Invite a user to an organization
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    await dbConnection.connect();

    // Parse and validate request body
    const body = await request.json();
    const validation = inviteUserSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw ApiErrors.UnprocessableEntity('Validation failed', { errors });
    }

    const { email, roles, orgId } = validation.data;
    const targetOrgId = orgId || session.orgId;

    // Verify the inviter has admin role in the target organization
    const inviterOrgRecord = await UserOrganization.findOne({
      userId: session.userId,
      orgId: targetOrgId,
      isActive: true,
    });

    if (!inviterOrgRecord || !inviterOrgRecord.roles.includes(UserRole.ADMIN)) {
      throw ApiErrors.Forbidden('Only admins can invite users to the organization');
    }

    // Find the user to invite
    const userToInvite = await User.findOne({ email: email.toLowerCase() });
    if (!userToInvite) {
      throw ApiErrors.NotFound('User with this email does not exist');
    }

    // Check if user is already in the organization
    const existingMembership = await UserOrganization.findOne({
      userId: userToInvite._id,
      orgId: targetOrgId,
    });

    if (existingMembership) {
      if (existingMembership.isActive) {
        throw ApiErrors.Conflict('User is already a member of this organization');
      } else {
        // Reactivate inactive membership
        existingMembership.isActive = true;
        existingMembership.roles = roles;
        existingMembership.invitedBy = session.userId as any;
        existingMembership.invitedAt = new Date();
        existingMembership.joinedAt = new Date();
        await existingMembership.save();

        logger.info('User membership reactivated', {
          userId: userToInvite._id.toString(),
          orgId: targetOrgId,
          invitedBy: session.userId,
        });

        return createSuccessResponse({
          message: 'User membership reactivated successfully',
          user: {
            id: userToInvite._id.toString(),
            email: userToInvite.email,
            roles: existingMembership.roles,
          },
        });
      }
    }

    // Create new UserOrganization record
    const userOrg = await UserOrganization.create({
      userId: userToInvite._id,
      orgId: targetOrgId,
      roles,
      isActive: true,
      invitedBy: session.userId,
      invitedAt: new Date(),
      joinedAt: new Date(),
    });

    logger.info('User invited to organization', {
      userId: userToInvite._id.toString(),
      orgId: targetOrgId,
      roles,
      invitedBy: session.userId,
    });

    return createSuccessResponse(
      {
        message: 'User invited successfully',
        user: {
          id: userToInvite._id.toString(),
          email: userToInvite.email,
          roles: userOrg.roles,
        },
      },
      201
    );
  } catch (error) {
    logger.error('Error inviting user to organization', { error });
    return handleApiError(error);
  }
}
