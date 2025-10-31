import { createSuccessResponse } from '@/lib/api-response';

/**
 * Liveness probe - returns 200 if the server is running
 * Used by orchestrators (K8s, Docker, etc.) to check if the process is alive
 */
export async function GET() {
  return createSuccessResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
