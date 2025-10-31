import { NextResponse } from 'next/server';

/**
 * RFC 7807 Problem Details for HTTP APIs
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  [key: string]: any;
}

/**
 * Custom API Exception class
 */
export class ApiException extends Error {
  constructor(
    public status: number,
    public type: string,
    public title: string,
    public detail?: string,
    public instance?: string,
    public extensions?: Record<string, any>
  ) {
    super(detail || title);
    this.name = 'ApiException';
  }

  toJSON(): ProblemDetails {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.detail,
      instance: this.instance,
      ...this.extensions,
    };
  }
}

/**
 * Common API errors
 */
export const ApiErrors = {
  BadRequest: (detail?: string, extensions?: Record<string, any>) =>
    new ApiException(400, 'bad-request', 'Bad Request', detail, undefined, extensions),

  Unauthorized: (detail?: string) =>
    new ApiException(401, 'unauthorized', 'Unauthorized', detail || 'Authentication required'),

  Forbidden: (detail?: string) =>
    new ApiException(403, 'forbidden', 'Forbidden', detail || 'Insufficient permissions'),

  NotFound: (detail?: string) =>
    new ApiException(404, 'not-found', 'Not Found', detail),

  Conflict: (detail?: string) =>
    new ApiException(409, 'conflict', 'Conflict', detail),

  UnprocessableEntity: (detail?: string, extensions?: Record<string, any>) =>
    new ApiException(422, 'unprocessable-entity', 'Unprocessable Entity', detail, undefined, extensions),

  TooManyRequests: (detail?: string) =>
    new ApiException(429, 'too-many-requests', 'Too Many Requests', detail),

  InternalServerError: (detail?: string) =>
    new ApiException(500, 'internal-server-error', 'Internal Server Error', detail),

  ServiceUnavailable: (detail?: string) =>
    new ApiException(503, 'service-unavailable', 'Service Unavailable', detail),
};

/**
 * Create an error response from an ApiException
 */
export function createErrorResponse(error: ApiException): NextResponse {
  return NextResponse.json(error.toJSON(), {
    status: error.status,
    headers: {
      'Content-Type': 'application/problem+json',
    },
  });
}

/**
 * Handle errors in API routes
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiException) {
    return createErrorResponse(error);
  }

  console.error('Unhandled API error:', error);

  return createErrorResponse(
    ApiErrors.InternalServerError('An unexpected error occurred')
  );
}
