/**
 * Hono middleware that enforces authentication on protected endpoints during
 * local development by decoding JWTs **without** cryptographic verification.
 *
 * The middleware mirrors the status codes and response bodies that API Gateway
 * returns when the Lambda authorizer rejects a request in production:
 *
 * - No `Authorization` header  → 401 `{"message":"Unauthorized"}`
 * - Non-Bearer / malformed JWT → 403 `{"message":"User is not authorized…"}`
 * - Valid JWT                  → sets `authorizerClaims` on the Hono context
 *                                and calls `next()`
 *
 * Usage (dev-server.ts):
 * ```typescript
 * import { localAuth } from "@<project>/lambda-utils";
 * app.use("/protected/*", localAuth());
 * ```
 *
 * @remarks
 * **Do not use in production.**  Token signatures are never verified.  This
 * middleware is intended solely for local dev servers running under Hono.
 */

import type { MiddlewareHandler } from "hono";

/** Shape stored on the Hono context under the "authorizerClaims" key. */
interface AuthorizerClaims {
  sub: string;
  username: string;
  email?: string;
}

/**
 * Shape of the decoded JWT payload that this middleware cares about.
 * All other fields are ignored.
 */
interface JwtPayload {
  sub?: unknown;
  username?: unknown;
  email?: unknown;
  [key: string]: unknown;
}

const DENY_MESSAGE =
  "User is not authorized to access this resource with an explicit deny";

/**
 * Attempts to decode the payload portion of a JWT **without verifying the
 * signature**.  Returns `null` on any failure so the caller can respond with
 * a 403 rather than throwing.
 *
 * Base64url decoding handles both standard (`+`, `/`) and URL-safe (`-`, `_`)
 * alphabet variants, and adds padding as required by `atob` / `Buffer.from`.
 *
 * @param token - The raw token string (everything after "Bearer ").
 * @returns The decoded payload or `null` if the token is structurally invalid.
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  // Normalise base64url → standard base64 and add padding.
  const base64 = (parts[1] ?? "")
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(
      Math.ceil((parts[1] ?? "").length / 4) * 4,
      "="
    );

  let json: string;
  try {
    // Buffer.from is available in Node 24 without any import.
    json = Buffer.from(base64, "base64").toString("utf8");
  } catch {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(json);
  } catch {
    return null;
  }

  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  return payload as JwtPayload;
}

/**
 * Builds the `AuthorizerClaims` object from a decoded JWT payload, coercing
 * all values to strings to match API Gateway's behaviour.
 *
 * Returns `null` when the required `sub` claim is absent or empty.
 *
 * @param payload - The decoded JWT payload.
 * @returns The claims object, or `null` if `sub` is missing.
 */
function buildClaims(payload: JwtPayload): AuthorizerClaims | null {
  if (typeof payload.sub !== "string" && typeof payload.sub !== "number") {
    return null;
  }

  const sub = String(payload.sub);
  if (sub === "") {
    return null;
  }

  const claims: AuthorizerClaims = {
    sub,
    username: String(payload.username ?? payload.sub),
  };

  if (payload.email !== undefined && payload.email !== null) {
    claims.email = String(payload.email);
  }

  return claims;
}

/**
 * Returns a Hono middleware that checks for a valid Bearer JWT in the
 * `Authorization` header and populates `authorizerClaims` on the context.
 *
 * Tokens are decoded but **never cryptographically verified** — suitable for
 * local development only.
 *
 * @returns A `MiddlewareHandler` that enforces token presence and basic
 *   structural validity.
 */
export function localAuth(): MiddlewareHandler {
  return async function localAuthMiddleware(c, next) {
    const authHeader = c.req.header("Authorization");

    // Code path 1: no Authorization header at all.
    if (!authHeader) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    // Code path 2: header present but not a Bearer token.
    if (!authHeader.startsWith("Bearer ")) {
      return c.json({ message: DENY_MESSAGE }, 403);
    }

    const token = authHeader.slice("Bearer ".length);

    // Code path 3a: invalid JWT structure (not exactly 3 dot-separated parts).
    const payload = decodeJwtPayload(token);
    if (payload === null) {
      return c.json({ message: DENY_MESSAGE }, 403);
    }

    // Code path 3b: JWT decoded but missing required `sub` claim.
    const claims = buildClaims(payload);
    if (claims === null) {
      return c.json({ message: DENY_MESSAGE }, 403);
    }

    // Code path 4: valid JWT — set claims and continue.
    c.set("authorizerClaims", claims);
    await next();
  };
}
