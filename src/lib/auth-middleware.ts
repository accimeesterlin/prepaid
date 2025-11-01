import { NextRequest } from 'next/server';
import { getSession, SessionPayload } from './auth';
import { ApiErrors } from './api-error';
import { UserRole } from '@pg-prepaid/types';

/**
 * Require authentication for a route
 */
export async function requireAuth(request: NextRequest): Promise<SessionPayload> {
  // Get session cookie from request
  const sessionCookie = request.cookies.get('session');

  if (!sessionCookie) {
    throw ApiErrors.Unauthorized('Authentication required');
  }

  const session = await getSession();

  if (!session) {
    throw ApiErrors.Unauthorized('Invalid or expired session');
  }

  return session;
}

/**
 * Require specific role(s) for a route
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<SessionPayload> {
  const session = await requireAuth(request);

  const hasRole = session.roles.some((role) => allowedRoles.includes(role));

  if (!hasRole) {
    throw ApiErrors.Forbidden('Insufficient permissions');
  }

  return session;
}

/**
 * Optional authentication - returns session if available, null otherwise
 */
export async function optionalAuth(): Promise<SessionPayload | null> {
  try {
    return await getSession();
  } catch {
    return null;
  }
}
