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
 *   400 — request body is missing, malformed JSON, or fails schema validation
 */

import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import type { User } from "../schemas/index.js";
import { CreateUserBodySchema } from "../schemas/index.js";
import { userRepository } from "../db/user-repository.js";

const HEADERS = { "Content-Type": "application/json" } as const;

/**
 * Handles POST /users — creates a new user and persists it via the repository.
 *
 * @param event - API Gateway proxy event.
 * @returns 201 with the created user, or 400 if the body is missing, malformed,
 *   or does not satisfy the CreateUserBodySchema.
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  // Guard: body must be present and parseable as JSON.
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

  // Validate the parsed payload against the schema.
  const parsed = CreateUserBodySchema.safeParse(parsedBody);
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

  const { name, email } = parsed.data;

  const now = new Date().toISOString();
  const user: User = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    createdAt: now,
    updatedAt: now,
  };

  await userRepository.create(user);

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
