/**
 * Test utilities for creating minimal valid {@link APIGatewayProxyEvent}
 * objects in unit tests.
 *
 * @example
 * ```typescript
 * import { createMockEvent } from "@<project>/lambda-utils";
 *
 * const event = createMockEvent({ httpMethod: "POST", body: '{"name":"Alice"}' });
 * const result = await handler(event);
 * expect(result.statusCode).toBe(201);
 * ```
 */

import type { APIGatewayProxyEvent } from "aws-lambda";

/**
 * Sensible defaults for the fields of {@link APIGatewayProxyEvent} that tests
 * rarely need to customise.  All fields can be overridden via `overrides`.
 */
const DEFAULT_EVENT: APIGatewayProxyEvent = {
  httpMethod: "GET",
  path: "/",
  headers: {
    "content-type": "application/json",
    accept: "application/json",
  },
  multiValueHeaders: {},
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  pathParameters: null,
  stageVariables: null,
  body: null,
  isBase64Encoded: false,
  requestContext: {
    accountId: "123456789012",
    apiId: "test-api-id",
    authorizer: {},
    protocol: "HTTP/1.1",
    httpMethod: "GET",
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
      sourceIp: "127.0.0.1",
      user: null,
      userAgent: "test-agent",
      userArn: null,
    },
    path: "/",
    resourceId: "test-resource-id",
    resourcePath: "/",
    requestId: "test-request-id",
    requestTimeEpoch: 0,
    stage: "test",
  },
  resource: "/",
};

/**
 * Creates a minimal valid {@link APIGatewayProxyEvent} for use in unit tests.
 *
 * Merges the provided `overrides` shallowly on top of the default event.  For
 * nested overrides (e.g. `requestContext`, `headers`) spread the defaults
 * explicitly:
 *
 * ```typescript
 * const event = createMockEvent({
 *   headers: { ...createMockEvent().headers, authorization: "Bearer token" },
 * });
 * ```
 *
 * @param overrides - Partial event fields to merge into the defaults.
 * @returns A fully-formed {@link APIGatewayProxyEvent}.
 */
export function createMockEvent(
  overrides?: Partial<APIGatewayProxyEvent>
): APIGatewayProxyEvent {
  return { ...DEFAULT_EVENT, ...overrides };
}
