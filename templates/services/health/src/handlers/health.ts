/**
 * Health check Lambda handler.
 *
 * This is the primary production entry point deployed to AWS Lambda.
 * It has zero framework dependencies — only the aws-lambda types (dev-only).
 *
 * Returns a 200 response with a JSON body containing a status indicator and
 * an ISO-8601 timestamp so callers can verify both liveness and clock skew.
 */

import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";

/**
 * Handles GET /health requests from API Gateway.
 *
 * @param _event - The API Gateway proxy event (unused — health checks need no
 *   request data).
 * @returns A 200 response with `{ status: "ok", timestamp }`.
 */
export async function handler(
  _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
  };
}
