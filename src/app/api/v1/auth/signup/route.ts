import { NextRequest } from 'next/server';
import { z } from 'zod';
import { dbConnection } from '@pg-prepaid/db/connection';
import { User } from '@pg-prepaid/db/models/user.model';
import { Org } from '@pg-prepaid/db/models/org.model';
import { UserRole } from '@pg-prepaid/types';
import { hashPassword, createToken, createSessionCookie } from '@/lib/auth';
import { ApiErrors, handleApiError } from '@/lib/api-error';
import { createSuccessResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  orgName: z.string().min(1, 'Organization name is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await dbConnection.connect();

    // Parse and validate request body
    const body = await request.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw ApiErrors.UnprocessableEntity('Validation failed', { errors });
    }

    const { email, password, orgName } = validation.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw ApiErrors.Conflict('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create organization
    const org = await Org.create({
      name: orgName,
      settings: {},
      paymentProviders: [],
    });

    logger.info('Organization created', { orgId: org._id.toString(), orgName });

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      roles: [UserRole.ADMIN], // First user is admin
      orgId: org._id,
      isActive: true,
    });

    logger.info('User created', { userId: user._id.toString(), email: user.email });

    // Create session token
    const token = await createToken({
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
      orgId: org._id.toString(),
    });

    // Create response with session cookie
    const response = createSuccessResponse({
      user: {
        id: user._id.toString(),
        email: user.email,
        roles: user.roles,
        orgId: org._id.toString(),
      },
    }, 201);

    response.headers.set('Set-Cookie', createSessionCookie(token));

    return response;
  } catch (error) {
    logger.error('Signup error', { error });
    return handleApiError(error);
  }
}
