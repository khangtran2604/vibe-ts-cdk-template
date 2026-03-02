/**
 * Update-user Lambda handler.
 *
 * This is the primary production entry point deployed to AWS Lambda.
 * It has zero framework dependencies — only the aws-lambda types (dev-only).
 *
 * PUT /users/:id
 * Body: { name?: string; email?: string }
 *
 * Responses:
 *   200 — user updated successfully
 *   400 — id missing or body is malformed
 *   404 — user not found
 */

// @feature:database import { UserRepository } from "../db/user-repository.js";

import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import type { UpdateUserBody } from "../types/index.js";
import { users } from "../store.js";

const HEADERS = { "Content-Type": "application/json" } as const;

/**
 * Handles PUT /users/:id — applies a partial update to an existing user.
 *
 * @param event - API Gateway proxy event.
 * @returns 200 with updated user, 404 if not found, or 400 if invalid.
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

  // Parse request body.
  let body: UpdateUserBody;
  try {
    if (!event.body) {
      throw new Error("Request body is required");
    }
    body = JSON.parse(event.body) as UpdateUserBody;
  } catch {
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Request body must be valid JSON",
        },
        timestamp: new Date().toISOString(),
      }),
    };
  }

  // @feature:database const existing = await userRepository.findById(id);
  const existing = users.get(id);

  if (!existing) {
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

  // Apply only the provided fields.
  const updated = {
    ...existing,
    ...(typeof body.name === "string" && body.name.trim() !== ""
      ? { name: body.name.trim() }
      : {}),
    ...(typeof body.email === "string" && body.email.trim() !== ""
      ? { email: body.email.trim().toLowerCase() }
      : {}),
    updatedAt: new Date().toISOString(),
  };

  // @feature:database await userRepository.update(id, updated);
  users.set(id, updated);

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({
      success: true,
      data: updated,
      message: "User updated successfully",
      timestamp: updated.updatedAt,
    }),
  };
}
