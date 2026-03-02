/**
 * Cognito JWT Lambda Authorizer.
 *
 * This is the primary production entry point deployed to AWS Lambda as a
 * TOKEN-type Lambda authorizer attached to API Gateway.
 *
 * It validates the Bearer token in the Authorization header against the
 * configured Cognito User Pool, then returns an IAM Allow or Deny policy
 * for API Gateway to enforce.
 *
 * Environment variables (injected by AuthStack):
 *   USER_POOL_ID — the Cognito User Pool ID (e.g. us-east-1_XXXXXXXXX)
 *   CLIENT_ID    — the Cognito App Client ID
 *   AWS_REGION   — standard Lambda env, used by aws-jwt-verify automatically
 */

import { CognitoJwtVerifier } from "aws-jwt-verify";
import type {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";

// ---------------------------------------------------------------------------
// Verifier is instantiated once at module scope so it is reused across warm
// Lambda invocations (the JWKS is cached after the first fetch).
// ---------------------------------------------------------------------------
const userPoolId = process.env["USER_POOL_ID"];
const clientId = process.env["CLIENT_ID"];

if (!userPoolId || !clientId) {
  throw new Error(
    "Missing required environment variables: USER_POOL_ID and CLIENT_ID must be set."
  );
}

const verifier = CognitoJwtVerifier.create({
  userPoolId,
  clientId,
  tokenUse: "access",
});

// ---------------------------------------------------------------------------
// Policy builder helpers
// ---------------------------------------------------------------------------

type PolicyEffect = "Allow" | "Deny";

/**
 * Builds an IAM policy document for API Gateway.
 *
 * @param principalId - The authenticated subject (sub claim or a fixed string
 *   for deny policies — API Gateway requires a non-empty value).
 * @param effect - "Allow" or "Deny".
 * @param resource - The ARN of the API Gateway method being invoked.
 * @param context - Optional key-value pairs forwarded to the integration as
 *   `$context.authorizer.*` variables.
 */
function buildPolicy(
  principalId: string,
  effect: PolicyEffect,
  resource: string,
  context?: Record<string, string>
): APIGatewayAuthorizerResult {
  const result: APIGatewayAuthorizerResult = {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };

  if (context) {
    result.context = context;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * Validates the Bearer JWT from the Authorization header.
 *
 * Returns an Allow policy on success and a Deny policy on any failure.
 * Throwing "Unauthorized" (string) instructs API Gateway to return 401,
 * but we intentionally return Deny (403) so that callers always receive a
 * structured IAM policy response rather than a raw gateway error.
 *
 * @param event - The API Gateway token authorizer event.
 * @returns An IAM policy document granting or denying access.
 */
export async function handler(
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> {
  const { authorizationToken, methodArn } = event;

  // Extract the raw token — value is "Bearer <token>" by convention.
  const token = extractBearerToken(authorizationToken);

  if (!token) {
    return buildPolicy("anonymous", "Deny", methodArn);
  }

  try {
    const payload = await verifier.verify(token);

    // Forward useful claims to the integration via $context.authorizer.*
    const context: Record<string, string> = {
      sub: String(payload.sub),
      username: String(payload.username ?? payload.sub),
    };

    // Include email if present (access tokens may omit it depending on scopes)
    if (payload["email"]) {
      context["email"] = String(payload["email"]);
    }

    return buildPolicy(String(payload.sub), "Allow", methodArn, context);
  } catch {
    // Token is missing, expired, tampered with, or from the wrong User Pool.
    // Do NOT log the token value — it is a credential.
    return buildPolicy("anonymous", "Deny", methodArn);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the raw JWT from a "Bearer <token>" Authorization header value.
 *
 * Returns `null` if the value is absent or not in Bearer format.
 */
function extractBearerToken(authorizationToken: string | undefined): string | null {
  if (!authorizationToken) return null;
  const parts = authorizationToken.split(" ");
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== "bearer") return null;
  return parts[1] ?? null;
}
