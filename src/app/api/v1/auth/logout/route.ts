import { NextRequest } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';
import { createNoContentResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { clearSentryUser } from '@/lib/sentry-utils';

export async function POST(_request: NextRequest) {
  try {
    logger.info('User logged out');

    // Clear Sentry user context
    clearSentryUser();

    const response = createNoContentResponse();
    response.headers.set('Set-Cookie', clearSessionCookie());

    return response;
  } catch (error) {
    logger.error('Logout error', { error });
    return handleApiError(error);
  }
}
