/**
 * Tests for the lambda-utils template files:
 *   - templates/packages/lambda-utils/src/middleware/local-auth.ts
 *   - templates/packages/lambda-utils/src/lambda-adapter.ts
 *   - templates/packages/lambda-utils/src/index.ts (barrel export)
 *
 * These are template files — they are not compiled as part of this CLI's
 * TypeScript build.  Vitest imports them directly via esbuild.
 *
 * Strategy:
 *   - Wire a tiny Hono app per test group using the real localAuth() middleware.
 *   - Use `app.request()` (Hono's built-in test helper) to exercise each code
 *     path without spinning up a real HTTP server.
 *   - For lambda-adapter.ts, pass a minimal spy handler to lambdaToHono() and
 *     assert that requestContext.authorizer is populated correctly.
 *
 * JWT helper:
 *   Tokens are created with an unsigned "none" algorithm.  The middleware only
 *   decodes — it never verifies — so any structurally valid JWT passes.
 */

import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Template root resolution
// ---------------------------------------------------------------------------

const TEMPLATE_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "templates"
);

const LAMBDA_UTILS_SRC = join(
  TEMPLATE_ROOT,
  "packages",
  "lambda-utils",
  "src"
);

// ---------------------------------------------------------------------------
// Dynamic imports of the template source files
// (deferred to after TEMPLATE_ROOT is defined so the paths are correct)
// ---------------------------------------------------------------------------

// We use dynamic import() so that the paths resolve at runtime using our
// computed TEMPLATE_ROOT value.  Vitest esbuild handles TypeScript files
// transparently, and the type-only Hono/aws-lambda imports are erased.

const { localAuth } = await import(
  join(LAMBDA_UTILS_SRC, "middleware", "local-auth.ts")
);

const { lambdaToHono } = await import(
  join(LAMBDA_UTILS_SRC, "lambda-adapter.ts")
);

const lambdaUtilsIndex = await import(join(LAMBDA_UTILS_SRC, "index.ts"));

// ---------------------------------------------------------------------------
// JWT helper — creates structurally valid but unsigned JWTs for testing.
//
// The middleware decodes (never verifies) so any correctly-formed token passes
// structural validation.  Using algorithm "none" communicates intent clearly.
// ---------------------------------------------------------------------------

function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString(
    "base64url"
  );
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.nosig`;
}

// ---------------------------------------------------------------------------
// Shared DENY_MESSAGE — mirrors the constant inside local-auth.ts.
// Duplicated here intentionally so the test asserts the exact string the
// middleware produces (a change in the source will cause the test to fail).
// ---------------------------------------------------------------------------

const DENY_MESSAGE =
  "User is not authorized to access this resource with an explicit deny";

// ---------------------------------------------------------------------------
// Helper: build a Hono app with localAuth() applied to ALL routes and a
// single GET "/" handler that returns 200 + "ok".
// ---------------------------------------------------------------------------

function buildAuthApp(): Hono {
  const app = new Hono();
  app.use("*", localAuth());
  app.get("/", (c) => c.text("ok"));
  return app;
}

// ===========================================================================
// local-auth.ts — Code path 1: no Authorization header
// ===========================================================================

describe("localAuth() — no Authorization header", () => {
  it("should return 401 when the Authorization header is absent", async () => {
    const app = buildAuthApp();
    const res = await app.request("/");
    expect(res.status).toBe(401);
  });

  it('should return {"message":"Unauthorized"} body', async () => {
    const app = buildAuthApp();
    const res = await app.request("/");
    const body = await res.json();
    expect(body).toEqual({ message: "Unauthorized" });
  });

  it("should set Content-Type to application/json", async () => {
    const app = buildAuthApp();
    const res = await app.request("/");
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
  });

  it("should not call next() (route handler body is never reached)", async () => {
    const app = buildAuthApp();
    const res = await app.request("/");
    // If next() had been called, text() would return "ok" with status 200.
    const text = await res.text();
    expect(text).not.toBe("ok");
  });
});

// ===========================================================================
// local-auth.ts — Code path 2: non-Bearer Authorization header
// ===========================================================================

describe("localAuth() — non-Bearer Authorization header", () => {
  it("should return 403 for a Basic auth header", async () => {
    const app = buildAuthApp();
    const res = await app.request("/", {
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });
    expect(res.status).toBe(403);
  });

  it("should return the deny message body for a Basic auth header", async () => {
    const app = buildAuthApp();
    const res = await app.request("/", {
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });
    const body = await res.json();
    expect(body).toEqual({ message: DENY_MESSAGE });
  });

  it("should return 403 when Authorization is just the word 'Bearer' with no token", async () => {
    const app = buildAuthApp();
    // "Bearer" without a trailing space does not start with "Bearer " (space)
    const res = await app.request("/", {
      headers: { Authorization: "Bearer" },
    });
    expect(res.status).toBe(403);
  });

  it("should return 403 for an API key style header (no scheme)", async () => {
    const app = buildAuthApp();
    const res = await app.request("/", {
      headers: { Authorization: "abc123" },
    });
    expect(res.status).toBe(403);
  });

  it("should return 403 for a Digest auth header", async () => {
    const app = buildAuthApp();
    const res = await app.request("/", {
      headers: { Authorization: "Digest realm=test" },
    });
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// local-auth.ts — Code path 3: Bearer token present but structurally invalid
// ===========================================================================

describe("localAuth() — invalid JWT structure (not 3 dot-separated parts)", () => {
  it("should return 403 when the token has only 2 parts", async () => {
    const app = buildAuthApp();
    const res = await app.request("/", {
      headers: { Authorization: "Bearer only.twoparts" },
    });
    expect(res.status).toBe(403);
  });

  it("should return 403 when the token has only 1 part (no dots)", async () => {
    const app = buildAuthApp();
    const res = await app.request("/", {
      headers: { Authorization: "Bearer nodots" },
    });
    expect(res.status).toBe(403);
  });

  it("should return 403 when the token has 4 parts", async () => {
    const app = buildAuthApp();
    const res = await app.request("/", {
      headers: { Authorization: "Bearer a.b.c.d" },
    });
    expect(res.status).toBe(403);
  });

  it("should return the deny message body for a structurally invalid token", async () => {
    const app = buildAuthApp();
    const res = await app.request("/", {
      headers: { Authorization: "Bearer only.twoparts" },
    });
    const body = await res.json();
    expect(body).toEqual({ message: DENY_MESSAGE });
  });

  it("should return 403 when the JWT payload segment is not valid base64", async () => {
    // Construct a 3-part token where the middle segment is not valid base64.
    // Using characters outside the base64 alphabet forces a decode failure.
    const badBase64 = "!!!not-base64!!!";
    const app = buildAuthApp();
    const res = await app.request("/", {
      headers: { Authorization: `Bearer header.${badBase64}.sig` },
    });
    // Buffer.from(badBase64, "base64") does NOT throw — it just produces
    // garbage bytes that fail JSON.parse.  The result is still a 403.
    expect(res.status).toBe(403);
  });

  it("should return 403 when the JWT payload decodes to a non-JSON string", async () => {
    // Base64-encode a raw string (not JSON) for the payload.
    const notJson = Buffer.from("this is not json").toString("base64url");
    const app = buildAuthApp();
    const res = await app.request("/", {
      headers: { Authorization: `Bearer hdr.${notJson}.sig` },
    });
    expect(res.status).toBe(403);
  });

  it("should return 403 when the JWT payload decodes to a JSON array (not an object)", async () => {
    const arrayPayload = Buffer.from(JSON.stringify([1, 2, 3])).toString(
      "base64url"
    );
    const app = buildAuthApp();
    const res = await app.request("/", {
      headers: { Authorization: `Bearer hdr.${arrayPayload}.sig` },
    });
    expect(res.status).toBe(403);
  });

  it("should return 403 when the JWT payload decodes to a JSON null", async () => {
    const nullPayload = Buffer.from("null").toString("base64url");
    const app = buildAuthApp();
    const res = await app.request("/", {
      headers: { Authorization: `Bearer hdr.${nullPayload}.sig` },
    });
    expect(res.status).toBe(403);
  });

  it("should return 403 when the JWT payload decodes to a JSON number", async () => {
    const numPayload = Buffer.from("42").toString("base64url");
    const app = buildAuthApp();
    const res = await app.request("/", {
      headers: { Authorization: `Bearer hdr.${numPayload}.sig` },
    });
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// local-auth.ts — Code path 3b: structurally valid JWT but missing sub claim
// ===========================================================================

describe("localAuth() — valid JWT structure but invalid/missing sub claim", () => {
  it("should return 403 when the payload has no sub field", async () => {
    const app = buildAuthApp();
    const token = makeJwt({ username: "alice" });
    const res = await app.request("/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });

  it("should return the deny message body when sub is absent", async () => {
    const app = buildAuthApp();
    const token = makeJwt({ username: "alice" });
    const res = await app.request("/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(body).toEqual({ message: DENY_MESSAGE });
  });

  it("should return 403 when sub is an empty string", async () => {
    const app = buildAuthApp();
    const token = makeJwt({ sub: "" });
    const res = await app.request("/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });

  it("should return 403 when sub is null", async () => {
    const app = buildAuthApp();
    const token = makeJwt({ sub: null });
    const res = await app.request("/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });

  it("should return 403 when sub is a boolean (not string or number)", async () => {
    const app = buildAuthApp();
    const token = makeJwt({ sub: true });
    const res = await app.request("/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });

  it("should return 403 when sub is an array", async () => {
    const app = buildAuthApp();
    const token = makeJwt({ sub: ["user-1"] });
    const res = await app.request("/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });

  it("should return 403 when sub is an object", async () => {
    const app = buildAuthApp();
    const token = makeJwt({ sub: { id: "user-1" } });
    const res = await app.request("/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// local-auth.ts — Code path 4: valid JWT → 200 + authorizerClaims populated
// ===========================================================================

describe("localAuth() — valid JWT with string sub", () => {
  it("should return 200 when a valid JWT is supplied", async () => {
    const app = buildAuthApp();
    const token = makeJwt({ sub: "user-abc" });
    const res = await app.request("/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });

  it("should call next() and reach the route handler", async () => {
    const app = buildAuthApp();
    const token = makeJwt({ sub: "user-abc" });
    const res = await app.request("/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    expect(text).toBe("ok");
  });
});

// ---------------------------------------------------------------------------
// authorizerClaims shape — verified by exposing context values through a
// dedicated route that returns the stored claims as JSON.
// ---------------------------------------------------------------------------

/** Builds an app that exposes the authorizerClaims context value as JSON. */
function buildClaimsInspectorApp(): Hono {
  const app = new Hono();
  app.use("*", localAuth());
  app.get("/claims", (c) => {
    const claims = c.get("authorizerClaims");
    return c.json(claims ?? null);
  });
  return app;
}

async function getClaims(
  token: string
): Promise<Record<string, unknown> | null> {
  const app = buildClaimsInspectorApp();
  const res = await app.request("/claims", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

describe("localAuth() — authorizerClaims.sub", () => {
  it("should set sub from the JWT payload", async () => {
    const claims = await getClaims(makeJwt({ sub: "user-123" }));
    expect(claims?.sub).toBe("user-123");
  });

  it("should coerce a numeric sub to a string", async () => {
    const claims = await getClaims(makeJwt({ sub: 42 }));
    expect(claims?.sub).toBe("42");
  });

  it("should coerce a large numeric sub to a string", async () => {
    const claims = await getClaims(makeJwt({ sub: 999999 }));
    expect(claims?.sub).toBe("999999");
  });
});

describe("localAuth() — authorizerClaims.username", () => {
  it("should fall back to sub when username is not in the token", async () => {
    const claims = await getClaims(makeJwt({ sub: "user-abc" }));
    expect(claims?.username).toBe("user-abc");
  });

  it("should use the username field from the token when present", async () => {
    const claims = await getClaims(
      makeJwt({ sub: "user-abc", username: "alice" })
    );
    expect(claims?.username).toBe("alice");
  });

  it("should coerce a numeric username to a string", async () => {
    const claims = await getClaims(
      makeJwt({ sub: "user-abc", username: 7 })
    );
    expect(claims?.username).toBe("7");
  });

  it("should use sub as username fallback when username is null", async () => {
    // username: null → payload.username ?? payload.sub = payload.sub (sub is used)
    const claims = await getClaims(
      makeJwt({ sub: "user-abc", username: null })
    );
    // null is falsy for ??, so String(null ?? "user-abc") = "user-abc"
    expect(claims?.username).toBe("user-abc");
  });
});

describe("localAuth() — authorizerClaims.email", () => {
  it("should include email when present in the token", async () => {
    const claims = await getClaims(
      makeJwt({ sub: "user-abc", email: "alice@example.com" })
    );
    expect(claims?.email).toBe("alice@example.com");
  });

  it("should exclude email when absent from the token", async () => {
    const claims = await getClaims(makeJwt({ sub: "user-abc" }));
    expect(Object.prototype.hasOwnProperty.call(claims, "email")).toBe(false);
  });

  it("should coerce a non-string email value to a string", async () => {
    const claims = await getClaims(
      makeJwt({ sub: "user-abc", email: 12345 })
    );
    expect(claims?.email).toBe("12345");
  });

  it("should exclude email when it is null in the token", async () => {
    const claims = await getClaims(
      makeJwt({ sub: "user-abc", email: null })
    );
    expect(Object.prototype.hasOwnProperty.call(claims, "email")).toBe(false);
  });

  it("should exclude email when it is undefined in the token", async () => {
    // JSON.stringify drops undefined values, so {email: undefined} becomes {}
    const claims = await getClaims(makeJwt({ sub: "user-abc" }));
    expect(Object.prototype.hasOwnProperty.call(claims, "email")).toBe(false);
  });
});

describe("localAuth() — base64url decoding (URL-safe characters)", () => {
  it("should decode a payload that uses the URL-safe base64url alphabet (- and _)", async () => {
    // Build a payload that, when base64url-encoded, produces characters that
    // include '-' and '_'.  We force this by using Buffer.from directly.
    // The string "~~??" encodes as base64 "fn4//" which has '/' and '+', but
    // base64url replaces those with '_' and '-'.  We'll instead encode a known
    // payload and swap the characters manually to test the normalisation path.
    const payload = { sub: "user-url-safe", email: "b@b.com" };
    const rawBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");
    // Simulate URL-safe variant: replace + → - and / → _
    const base64url = rawBase64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
    const token = `${header}.${base64url}.nosig`;

    const claims = await getClaims(token);
    expect(claims?.sub).toBe("user-url-safe");
    expect(claims?.email).toBe("b@b.com");
  });

  it("should decode a payload regardless of padding (no trailing = signs)", async () => {
    // makeJwt uses Buffer.toString("base64url") which omits padding — this
    // test verifies the padEnd logic handles the missing = characters.
    const token = makeJwt({ sub: "pad-test-user" });
    const claims = await getClaims(token);
    expect(claims?.sub).toBe("pad-test-user");
  });
});

// ===========================================================================
// lambda-adapter.ts — authorizer claims integration
// ===========================================================================

describe("lambdaToHono() — requestContext.authorizer when no localAuth", () => {
  it("should pass an empty object as authorizer for unprotected routes", async () => {
    // No localAuth middleware: authorizerClaims is never set on the context.
    let capturedAuthorizer: unknown;

    const app = new Hono();
    app.get("/unprotected", async (c) => {
      // Wrap a spy handler via lambdaToHono that captures the event.
      const handler = async (event: { requestContext: { authorizer: unknown } }) => {
        capturedAuthorizer = event.requestContext.authorizer;
        return { statusCode: 200, body: "ok", headers: {} };
      };
      return lambdaToHono(handler as Parameters<typeof lambdaToHono>[0])(c);
    });

    await app.request("/unprotected");
    expect(capturedAuthorizer).toEqual({});
  });
});

describe("lambdaToHono() — requestContext.authorizer when localAuth sets claims", () => {
  it("should forward authorizerClaims from localAuth into requestContext.authorizer", async () => {
    let capturedAuthorizer: unknown;

    const app = new Hono();
    app.use("*", localAuth());
    app.get("/protected", async (c) => {
      const handler = async (event: { requestContext: { authorizer: unknown } }) => {
        capturedAuthorizer = event.requestContext.authorizer;
        return { statusCode: 200, body: "ok", headers: {} };
      };
      return lambdaToHono(handler as Parameters<typeof lambdaToHono>[0])(c);
    });

    const token = makeJwt({ sub: "user-xyz", email: "x@y.com" });
    await app.request("/protected", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(capturedAuthorizer).toEqual({
      sub: "user-xyz",
      username: "user-xyz",
      email: "x@y.com",
    });
  });

  it("should set authorizer.sub correctly when localAuth sets claims", async () => {
    let capturedAuthorizer: Record<string, unknown> | null = null;

    const app = new Hono();
    app.use("*", localAuth());
    app.get("/protected", async (c) => {
      const handler = async (event: { requestContext: { authorizer: unknown } }) => {
        capturedAuthorizer = event.requestContext.authorizer as Record<string, unknown>;
        return { statusCode: 200, body: "", headers: {} };
      };
      return lambdaToHono(handler as Parameters<typeof lambdaToHono>[0])(c);
    });

    const token = makeJwt({ sub: "claim-sub-value" });
    await app.request("/protected", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(capturedAuthorizer?.sub).toBe("claim-sub-value");
  });

  it("should set authorizer.username correctly when localAuth sets claims", async () => {
    let capturedAuthorizer: Record<string, unknown> | null = null;

    const app = new Hono();
    app.use("*", localAuth());
    app.get("/protected", async (c) => {
      const handler = async (event: { requestContext: { authorizer: unknown } }) => {
        capturedAuthorizer = event.requestContext.authorizer as Record<string, unknown>;
        return { statusCode: 200, body: "", headers: {} };
      };
      return lambdaToHono(handler as Parameters<typeof lambdaToHono>[0])(c);
    });

    const token = makeJwt({ sub: "user-id", username: "bob" });
    await app.request("/protected", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(capturedAuthorizer?.username).toBe("bob");
  });
});

describe("lambdaToHono() — basic HTTP forwarding", () => {
  it("should forward the Lambda handler status code to the Hono response", async () => {
    const app = new Hono();
    app.get("/status", async (c) => {
      const handler = async () => ({
        statusCode: 204,
        body: "",
        headers: {},
      });
      return lambdaToHono(handler as Parameters<typeof lambdaToHono>[0])(c);
    });

    const res = await app.request("/status");
    expect(res.status).toBe(204);
  });

  it("should forward the Lambda handler body to the Hono response", async () => {
    const app = new Hono();
    app.get("/body", async (c) => {
      const handler = async () => ({
        statusCode: 200,
        body: '{"hello":"world"}',
        headers: { "content-type": "application/json" },
      });
      return lambdaToHono(handler as Parameters<typeof lambdaToHono>[0])(c);
    });

    const res = await app.request("/body");
    const json = await res.json();
    expect(json).toEqual({ hello: "world" });
  });

  it("should forward Lambda handler response headers", async () => {
    const app = new Hono();
    app.get("/headers", async (c) => {
      const handler = async () => ({
        statusCode: 200,
        body: "ok",
        headers: { "x-custom-header": "my-value" },
      });
      return lambdaToHono(handler as Parameters<typeof lambdaToHono>[0])(c);
    });

    const res = await app.request("/headers");
    expect(res.headers.get("x-custom-header")).toBe("my-value");
  });
});

// ===========================================================================
// index.ts — barrel export
// ===========================================================================

describe("lambda-utils index.ts barrel export", () => {
  it("should export localAuth", () => {
    expect(lambdaUtilsIndex.localAuth).toBeDefined();
    expect(typeof lambdaUtilsIndex.localAuth).toBe("function");
  });

  it("should export lambdaToHono", () => {
    expect(lambdaUtilsIndex.lambdaToHono).toBeDefined();
    expect(typeof lambdaUtilsIndex.lambdaToHono).toBe("function");
  });

  it("should export createMockEvent", () => {
    expect(lambdaUtilsIndex.createMockEvent).toBeDefined();
    expect(typeof lambdaUtilsIndex.createMockEvent).toBe("function");
  });

  it("should export errorHandler", () => {
    expect(lambdaUtilsIndex.errorHandler).toBeDefined();
    expect(typeof lambdaUtilsIndex.errorHandler).toBe("function");
  });

  it("should export localAuth that returns a middleware function", () => {
    const middleware = lambdaUtilsIndex.localAuth();
    expect(typeof middleware).toBe("function");
  });

  it("localAuth from index.ts should be the same implementation as direct import", async () => {
    // Both should produce middleware functions that enforce the same 401 behaviour.
    const app = new Hono();
    app.use("*", lambdaUtilsIndex.localAuth());
    app.get("/", (c) => c.text("ok"));

    const res = await app.request("/");
    // No auth header → 401
    expect(res.status).toBe(401);
  });
});
