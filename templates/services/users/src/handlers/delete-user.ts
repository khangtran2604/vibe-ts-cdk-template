/**
 * Delete-user Lambda handler.
 *
 * This is the primary production entry point deployed to AWS Lambda.
 * It has zero framework dependencies — only the aws-lambda types (dev-only).
 *
 * DELETE /users/:id
 *
 * Responses:
 *   204 — user deleted (no response body)
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
 * Handles DELETE /users/:id — removes a user via the repository.
 *
 * Returns 204 No Content on success (body is an empty string per the
 * APIGatewayProxyResult shape — the HTTP spec requires no body for 204).
 *
 * @param event - API Gateway proxy event.
 * @returns 204 on success, 404 if not found, or 400 if `id` is absent.
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

  const exists = await userRepository.exists(id);

  if (!exists) {
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

  await userRepository.delete(id);

  // 204 No Content — body must be empty.
  return {
    statusCode: 204,
    headers: HEADERS,
    body: "",
  };
}
