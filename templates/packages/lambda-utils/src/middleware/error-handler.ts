/**
 * Hono error-handler middleware for the local dev server.
 *
 * Catches any unhandled error thrown inside a route and returns a structured
 * JSON response so the dev server behaves consistently with Lambda handlers
 * that catch their own errors and return 500 responses.
 *
 * Usage (dev-server.ts):
 * ```typescript
 * import { errorHandler } from "@<project>/lambda-utils";
 * app.onError(errorHandler);
 * ```
 */

import type { Context } from "hono";

interface ErrorBody {
  error: string;
  message: string;
  requestId?: string;
}

/**
 * Hono `onError` handler.  Maps any thrown error to a 500 JSON response.
 * Internal error details are logged to `stderr` but never forwarded to the
 * caller, which mirrors Lambda production behaviour.
 *
 * @param err - The error that was thrown.
 * @param c   - The Hono context for the failing request.
 * @returns A 500 JSON response.
 */
export function errorHandler(err: Error, c: Context): Response {
  // Log the full error server-side (visible in the terminal dev server log).
  // eslint-disable-next-line no-console
  console.error("[error-handler]", err);

  const body: ErrorBody = {
    error: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred.",
  };

  return c.json(body, 500);
}
