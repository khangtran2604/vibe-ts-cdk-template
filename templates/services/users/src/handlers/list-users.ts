/**
 * List-users Lambda handler.
 *
 * This is the primary production entry point deployed to AWS Lambda.
 * It has zero framework dependencies — only the aws-lambda types (dev-only).
 *
 * GET /users
 * Query params: limit (default 20, max 100), cursor (opaque pagination token)
 *
 * Responses:
 *   200 — list of users (may be empty)
 */

// @feature:database import { UserRepository } from "../db/user-repository.js";

import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import { users } from "../store.js";

const HEADERS = { "Content-Type": "application/json" } as const;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Handles GET /users — returns a paginated list of all users.
 *
 * Uses simple offset-based pagination backed by insertion order of the
 * in-memory Map.  The cursor is the last-seen user ID; pass it as the
 * `cursor` query parameter to fetch the next page.
 *
 * @param event - API Gateway proxy event.
 * @returns 200 with paginated user list.
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const rawLimit = event.queryStringParameters?.["limit"];
  const cursor = event.queryStringParameters?.["cursor"] ?? null;

  // Parse and clamp limit.
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(rawLimit ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  );

  // @feature:database const { items, total } = await userRepository.list({ limit, cursor });

  // In-memory implementation: collect all users in insertion order.
  const allUsers = Array.from(users.values());
  const total = allUsers.length;

  // Find the start index based on the cursor (ID of the last-seen item).
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = allUsers.findIndex((u) => u.id === cursor);
    // If cursor not found we start from the beginning (graceful degradation).
    startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }

  const items = allUsers.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < total;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({
      success: true,
      data: {
        items,
        pagination: {
          total,
          limit,
          ...(nextCursor ? { cursor: nextCursor } : {}),
          hasMore,
        },
      },
      timestamp: new Date().toISOString(),
    }),
  };
}
