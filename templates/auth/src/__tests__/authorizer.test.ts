/**
 * Unit tests for the Cognito JWT Lambda authorizer.
 *
 * aws-jwt-verify is mocked so no real Cognito calls are made.
 * The module-level verifier creation and env-var guard are exercised by
 * setting process.env before the module is imported.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { APIGatewayTokenAuthorizerEvent } from "aws-lambda";

// ---------------------------------------------------------------------------
// Hoisted mocks — must be defined before any module imports are resolved.
// ---------------------------------------------------------------------------

const { mockVerify } = vi.hoisted(() => ({
  mockVerify: vi.fn(),
}));

vi.mock("aws-jwt-verify", () => ({
  CognitoJwtVerifier: {
    create: () => ({
      verify: mockVerify,
    }),
  },
}));

// Set required env vars before importing the module under test so the
// module-level guard (throw if missing) does not fire during testing.
vi.stubEnv("USER_POOL_ID", "us-east-1_TESTPOOL");
vi.stubEnv("CLIENT_ID", "test-client-id");

// Dynamic import deferred so vi.mock and vi.stubEnv are applied first.
const { handler } = await import("../authorizer.js");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(
  authorizationToken: string
): APIGatewayTokenAuthorizerEvent {
  return {
    type: "TOKEN",
    authorizationToken,
    methodArn:
      "arn:aws:execute-api:us-east-1:123456789012:abcdef1234/dev/GET/users",
  };
}

const METHOD_ARN =
  "arn:aws:execute-api:us-east-1:123456789012:abcdef1234/dev/GET/users";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authorizer handler — valid token", () => {
  it("returns an Allow policy when the JWT is valid", async () => {
    mockVerify.mockResolvedValue({
      sub: "user-123",
      username: "alice",
      email: "alice@example.com",
    });

    const result = await handler(makeEvent("Bearer valid.jwt.token"));

    expect(result.policyDocument.Statement[0]?.Effect).toBe("Allow");
  });

  it("sets principalId to the sub claim on success", async () => {
    mockVerify.mockResolvedValue({
      sub: "user-456",
      username: "bob",
    });

    const result = await handler(makeEvent("Bearer valid.jwt.token"));

    expect(result.principalId).toBe("user-456");
  });

  it("forwards sub, username, and email as authorizer context on success", async () => {
    mockVerify.mockResolvedValue({
      sub: "user-789",
      username: "carol",
      email: "carol@example.com",
    });

    const result = await handler(makeEvent("Bearer valid.jwt.token"));

    expect(result.context?.["sub"]).toBe("user-789");
    expect(result.context?.["username"]).toBe("carol");
    expect(result.context?.["email"]).toBe("carol@example.com");
  });

  it("omits email from context when not present in payload", async () => {
    mockVerify.mockResolvedValue({
      sub: "user-000",
      username: "dave",
      // no email claim
    });

    const result = await handler(makeEvent("Bearer valid.jwt.token"));

    expect(result.context?.["email"]).toBeUndefined();
  });

  it("includes the correct resource ARN in the policy statement", async () => {
    mockVerify.mockResolvedValue({ sub: "u1", username: "u1" });

    const result = await handler(makeEvent("Bearer valid.jwt.token"));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = result.policyDocument.Statement[0] as any;
    expect(stmt?.Resource).toBe(METHOD_ARN);
  });
});

describe("authorizer handler — invalid or expired token", () => {
  it("returns a Deny policy when verification throws", async () => {
    mockVerify.mockRejectedValue(new Error("Token expired"));

    const result = await handler(makeEvent("Bearer expired.jwt.token"));

    expect(result.policyDocument.Statement[0]?.Effect).toBe("Deny");
  });

  it("sets principalId to 'anonymous' on verification failure", async () => {
    mockVerify.mockRejectedValue(new Error("Invalid signature"));

    const result = await handler(makeEvent("Bearer bad.jwt.token"));

    expect(result.principalId).toBe("anonymous");
  });

  it("does not include context on a Deny policy from verification failure", async () => {
    mockVerify.mockRejectedValue(new Error("Invalid"));

    const result = await handler(makeEvent("Bearer bad.jwt.token"));

    // context may be undefined or empty — must not contain valid user data
    expect(result.context?.["sub"]).toBeUndefined();
  });
});

describe("authorizer handler — missing or malformed token", () => {
  it("returns a Deny policy when the Authorization header is absent", async () => {
    const event: APIGatewayTokenAuthorizerEvent = {
      type: "TOKEN",
      authorizationToken: "",
      methodArn: METHOD_ARN,
    };

    const result = await handler(event);

    expect(result.policyDocument.Statement[0]?.Effect).toBe("Deny");
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("returns a Deny policy when the token is not in Bearer format", async () => {
    const result = await handler(makeEvent("Basic dXNlcjpwYXNz"));

    expect(result.policyDocument.Statement[0]?.Effect).toBe("Deny");
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("returns a Deny policy when the Authorization value is just 'Bearer' with no token", async () => {
    const result = await handler(makeEvent("Bearer"));

    expect(result.policyDocument.Statement[0]?.Effect).toBe("Deny");
    expect(mockVerify).not.toHaveBeenCalled();
  });
});
