/**
 * Create-user Lambda handler.
 *
 * This is the primary production entry point deployed to AWS Lambda.
 * It has zero framework dependencies — only the aws-lambda types (dev-only).
 *
 * POST /users
 * Body: { name: string; email: string }
 *
 * Responses:
 *   201 — user created successfully
 *   400 — request body is missing or malformed
 */

// @feature:database import { UserRepository } from "../db/user-repository.js";

import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import type { CreateUserBody, User } from "../types/index.js";
import { users } from "../store.js";

const HEADERS = { "Content-Type": "application/json" } as const;

/**
 * Handles POST /users — creates a new user and stores it in memory.
 *
 * @param event - API Gateway proxy event.
 * @returns 201 with the created user, or 400 if the body is invalid.
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  // Parse and validate request body.
  let body: CreateUserBody;
  try {
    if (!event.body) {
      throw new Error("Request body is required");
    }
    body = JSON.parse(event.body) as CreateUserBody;
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

  const { name, email } = body;

  if (typeof name !== "string" || name.trim() === "") {
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Field 'name' is required and must be a non-empty string",
          fieldErrors: { name: "Required" },
        },
        timestamp: new Date().toISOString(),
      }),
    };
  }

  if (typeof email !== "string" || email.trim() === "") {
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Field 'email' is required and must be a non-empty string",
          fieldErrors: { email: "Required" },
        },
        timestamp: new Date().toISOString(),
      }),
    };
  }

  const now = new Date().toISOString();
  const user: User = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    createdAt: now,
    updatedAt: now,
  };

  // @feature:database await userRepository.create(user);
  users.set(user.id, user);

  return {
    statusCode: 201,
    headers: HEADERS,
    body: JSON.stringify({
      success: true,
      data: user,
      message: "User created successfully",
      timestamp: now,
    }),
  };
}
