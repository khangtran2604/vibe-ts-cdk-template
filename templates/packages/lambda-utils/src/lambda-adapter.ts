/**
 * lambdaToHono — adapts a Lambda handler into a Hono route handler.
 *
 * Used exclusively in dev-server.ts files (local development only).
 * Lambda handlers are the production entry points; Hono wraps them locally.
 *
 * @example
 * ```typescript
 * import { Hono } from "hono";
 * import { serve } from "@hono/node-server";
 * import { lambdaToHono } from "@<project>/lambda-utils";
 * import { handler } from "./index.js";
 *
 * const app = new Hono();
 * app.all("*", lambdaToHono(handler));
 * serve({ fetch: app.fetch, port: 3001 });
 * ```
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import type { Context } from "hono";

/** The shape of a Lambda handler this adapter accepts. */
export type LambdaHandler = (
  event: APIGatewayProxyEvent
) => Promise<APIGatewayProxyResult>;

/**
 * Converts a Hono {@link Context} into a minimal {@link APIGatewayProxyEvent}.
 *
 * Only the fields most commonly used in Lambda handlers are populated.
 * Headers, query string parameters, and the path/method are all forwarded
 * faithfully from the incoming HTTP request.
 */
async function honoContextToEvent(
  c: Context
): Promise<APIGatewayProxyEvent> {
  const url = new URL(c.req.url);

  // Build query string parameters map — API GW passes these as a flat object.
  const queryStringParameters: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryStringParameters[key] = value;
  });

  // Collect headers — API GW lowercases all header names.
  const headers: Record<string, string> = {};
  c.req.raw.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  // Read body — may be null for GET/HEAD/DELETE etc.
  let body: string | null = null;
  const contentLength = c.req.raw.headers.get("content-length");
  const hasBody = contentLength !== null && contentLength !== "0";
  if (hasBody) {
    body = await c.req.text();
  }

  // Extract Hono path parameters (e.g. :id from /users/:id) and forward them
  // as event.pathParameters, mirroring the API Gateway contract.
  const rawParams = c.req.param();
  const pathParameters =
    Object.keys(rawParams).length > 0 ? rawParams : null;

  return {
    httpMethod: c.req.method,
    path: url.pathname,
    headers,
    multiValueHeaders: {},
    queryStringParameters:
      Object.keys(queryStringParameters).length > 0
        ? queryStringParameters
        : null,
    multiValueQueryStringParameters: null,
    pathParameters,
    stageVariables: null,
    body,
    isBase64Encoded: false,
    requestContext: {
      accountId: "local",
      apiId: "local",
      authorizer: {},
      protocol: "HTTP/1.1",
      httpMethod: c.req.method,
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: c.req.raw.headers.get("x-forwarded-for") ?? "127.0.0.1",
        user: null,
        userAgent: c.req.raw.headers.get("user-agent") ?? "",
        userArn: null,
      },
      path: url.pathname,
      resourceId: "local",
      resourcePath: url.pathname,
      requestId: crypto.randomUUID(),
      requestTimeEpoch: Date.now(),
      stage: "local",
    },
    resource: url.pathname,
  };
}

/**
 * Wraps a Lambda handler as a Hono route handler for local development.
 *
 * Converts the incoming Hono request to an {@link APIGatewayProxyEvent},
 * invokes the Lambda handler, then maps the {@link APIGatewayProxyResult}
 * back to a Hono response.  Status code, headers, and body are all forwarded.
 *
 * @param handler - The Lambda handler to wrap.
 * @returns A Hono-compatible route handler.
 */
export function lambdaToHono(
  handler: LambdaHandler
): (c: Context) => Promise<Response> {
  return async (c: Context) => {
    const event = await honoContextToEvent(c);
    const result = await handler(event);

    // Forward all headers returned by the Lambda handler.
    const responseHeaders = new Headers();
    if (result.headers) {
      for (const [key, value] of Object.entries(result.headers)) {
        if (value !== undefined) {
          responseHeaders.set(key, String(value));
        }
      }
    }
    if (result.multiValueHeaders) {
      for (const [key, values] of Object.entries(result.multiValueHeaders)) {
        if (Array.isArray(values)) {
          // Append each value separately so the header is multi-valued.
          for (const v of values) {
            responseHeaders.append(key, String(v));
          }
        }
      }
    }

    // Decode base64 body if the Lambda handler base64-encoded it.
    const body = result.isBase64Encoded
      ? Buffer.from(result.body ?? "", "base64").toString("utf8")
      : (result.body ?? "");

    return new Response(body || null, {
      status: result.statusCode,
      headers: responseHeaders,
    });
  };
}
