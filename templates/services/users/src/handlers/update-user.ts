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

import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import { UpdateUserBodySchema } from "../schemas/index.js";
import { userRepository } from "../db/user-repository.js";

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

  // Parse request body — guard against malformed JSON first.
  let parsedBody: unknown;
  try {
    if (!event.body) {
      throw new Error("Request body is required");
    }
    parsedBody = JSON.parse(event.body);
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

  // Validate body shape and field constraints with Zod.
  const parsed = UpdateUserBodySchema.safeParse(parsedBody);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.length > 0 ? issue.path.join(".") : "_root";
      fieldErrors[key] = issue.message;
    }
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request body validation failed",
          fieldErrors,
        },
        timestamp: new Date().toISOString(),
      }),
    };
  }

  const existing = await userRepository.findById(id);

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

  // Apply only the fields that were supplied in the validated body.
  // Zod guarantees the types; trim name and lowercase email for storage consistency.
  const updated = {
    ...existing,
    ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
    ...(parsed.data.email !== undefined
      ? { email: parsed.data.email.trim().toLowerCase() }
      : {}),
    updatedAt: new Date().toISOString(),
  };

  await userRepository.update(id, updated);

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
