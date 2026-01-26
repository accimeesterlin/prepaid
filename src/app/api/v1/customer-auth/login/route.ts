/**
 * Customer Login Endpoint
 * POST /api/v1/customer-auth/login
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { Customer } from '@pg-prepaid/db';
import { Org } from '@pg-prepaid/db';
import { ApiErrors } from '@/lib/api-error';
import { createSuccessResponse } from '@/lib/api-response';
import { createCustomerSession } from '@/lib/customer-auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  orgSlug: z.string().min(1, 'Organization slug is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    // Find organization by slug
    const org = await Org.findOne({ slug: data.orgSlug.toLowerCase() });

    if (!org) {
      throw ApiErrors.Unauthorized('Invalid credentials');
    }

    // Find customer with password hash
    const customer = await Customer.findOne({
      email: data.email.toLowerCase(),
      orgId: org._id.toString(),
    }).select('+passwordHash');

    if (!customer || !customer.passwordHash) {
      throw ApiErrors.Unauthorized('Invalid credentials');
    }

    // Verify password
    const isValid = await customer.comparePassword(data.password);

    if (!isValid) {
      throw ApiErrors.Unauthorized('Invalid credentials');
    }

    // Create session
    await createCustomerSession({
      customerId: customer._id.toString(),
      orgId: org._id.toString(),
      email: customer.email!,
      emailVerified: customer.emailVerified,
      name: customer.name,
    });

    return createSuccessResponse({
      message: 'Login successful',
      customer: {
        id: customer._id.toString(),
        email: customer.email,
        name: customer.name,
        emailVerified: customer.emailVerified,
        currentBalance: customer.currentBalance,
        balanceCurrency: customer.balanceCurrency,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ApiErrors.BadRequest(error.errors[0].message);
    }
    throw error;
  }
}
