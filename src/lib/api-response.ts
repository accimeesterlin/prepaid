import { NextResponse } from 'next/server';

export { createErrorResponse as createErrorResponseFromException } from './api-error';
import { ApiException } from './api-error';

/**
 * Create an error response from a message and status code
 */
export function createErrorResponse(message: string, status: number = 500): NextResponse {
  const error = new ApiException(
    status,
    status >= 500 ? 'server-error' : 'client-error',
    getStatusText(status),
    message
  );

  return NextResponse.json(error.toJSON(), {
    status: error.status,
    headers: {
      'Content-Type': 'application/problem+json',
    },
  });
}

function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    503: 'Service Unavailable',
  };
  return statusTexts[status] || 'Error';
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Create a created response (201)
 */
export function createCreatedResponse<T>(data: T): NextResponse {
  return createSuccessResponse(data, 201);
}

/**
 * Create a no content response (204)
 */
export function createNoContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
