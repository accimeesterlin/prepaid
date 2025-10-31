import { NextResponse } from 'next/server';

export { createErrorResponse } from './api-error';

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
