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

import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import { userRepository } from "../db/user-repository.js";

const HEADERS = { "Content-Type": "application/json" } as const;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Handles GET /users — returns a paginated list of all users.
 *
 * The cursor is the last-seen user ID; pass it as the `cursor` query parameter
 * to fetch the next page.  The repository implementation handles the actual
 * pagination strategy (in-memory slice or DynamoDB ExclusiveStartKey).
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

  const { items, total } = await userRepository.list({ limit, cursor });

  const hasMore = items.length === limit;
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
