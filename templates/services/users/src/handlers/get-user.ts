/**
 * Get-user Lambda handler.
 *
 * This is the primary production entry point deployed to AWS Lambda.
 * It has zero framework dependencies — only the aws-lambda types (dev-only).
 *
 * GET /users/:id
 *
 * Responses:
 *   200 — user found
 *   400 — id path parameter is missing
 *   404 — user not found
 */

import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import { userRepository } from "../db/user-repository.js";

const HEADERS = { "Content-Type": "application/json" } as const;

/**
 * Handles GET /users/:id — retrieves a single user by ID.
 *
 * API Gateway injects the `{id}` path parameter into `event.pathParameters`.
 *
 * @param event - API Gateway proxy event.
 * @returns 200 with the user, 404 if not found, or 400 if `id` is absent.
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const id = event.pathParameters?.["id"];

  if (!id) {
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Path parameter 'id' is required",
        },
        timestamp: new Date().toISOString(),
      }),
    };
  }

  const user = await userRepository.findById(id);

  if (!user) {
    return {
      statusCode: 404,
      headers: HEADERS,
      body: JSON.stringify({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `User with id '${id}' not found`,
        },
        timestamp: new Date().toISOString(),
      }),
    };
  }

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    }),
  };
}
