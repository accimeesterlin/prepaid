import { NextRequest } from 'next/server';
import { z } from 'zod';
import { dbConnection } from '@pg-prepaid/db/connection';
import { User } from '@pg-prepaid/db/models/user.model';
import { verifyPassword, createToken, createSessionCookie } from '@/lib/auth';
import { ApiErrors, handleApiError } from '@/lib/api-error';
import { createSuccessResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await dbConnection.connect();

    // Parse and validate request body
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw ApiErrors.UnprocessableEntity('Validation failed', { errors });
    }

    const { email, password } = validation.data;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw ApiErrors.Unauthorized('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw ApiErrors.Forbidden('Account is inactive');
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw ApiErrors.Unauthorized('Invalid email or password');
    }

    logger.info('User logged in', { userId: user._id.toString(), email: user.email });

    // Create session token
    const token = await createToken({
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
      orgId: user.orgId.toString(),
    });

    // Create response with session cookie
    const response = createSuccessResponse({
      user: {
        id: user._id.toString(),
        email: user.email,
        roles: user.roles,
        orgId: user.orgId.toString(),
      },
    });

    response.headers.set('Set-Cookie', createSessionCookie(token));

    return response;
  } catch (error) {
    logger.error('Login error', { error });
    return handleApiError(error);
  }
}
