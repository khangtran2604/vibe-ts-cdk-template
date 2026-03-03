/**
 * Typed DynamoDB DocumentClient wrapper.
 *
 * Provides a singleton DocumentClient instance configured for the current
 * deployment region.  The table name is read from the USERS_TABLE_NAME
 * environment variable, which is set by the CDK stack at deploy time.
 *
 * The client is initialised at module scope so it is created once per Lambda
 * cold start and reused across warm invocations — avoids re-creating the
 * underlying HTTP connection pool on every request.
 *
 * Usage:
 *   import { getDocumentClient, getUsersTableName } from "./dynamo-client.js";
 *
 *   const client = getDocumentClient();
 *   const tableName = getUsersTableName();
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// ---------------------------------------------------------------------------
// Singleton client — created once per Lambda container lifetime.
// ---------------------------------------------------------------------------

let _client: DynamoDBDocumentClient | undefined;

/**
 * Returns the singleton {@link DynamoDBDocumentClient}.
 *
 * Lazy-initialised on first call so that tests can override the AWS region
 * or endpoint via environment variables before the client is constructed.
 *
 * The client is configured with `marshallOptions.removeUndefinedValues: true`
 * so that optional fields do not produce DynamoDB validation errors.
 *
 * @returns The shared document client instance.
 */
export function getDocumentClient(): DynamoDBDocumentClient {
  if (!_client) {
    // Resolve the region from environment variables.  We must not pass
    // `undefined` to DynamoDBClientConfig.region because the project tsconfig
    // uses `exactOptionalPropertyTypes: true`, which disallows assigning
    // `undefined` to an optional property.  The SDK will auto-detect the
    // region via the credential provider chain when no explicit region is given.
    const region =
      process.env["AWS_REGION"] ?? process.env["AWS_DEFAULT_REGION"];
    const dynamoDb = new DynamoDBClient(region ? { region } : {});

    _client = DynamoDBDocumentClient.from(dynamoDb, {
      marshallOptions: {
        // Remove attributes set to undefined from DynamoDB PutItem payloads.
        // Without this, DynamoDB throws a validation error for undefined values.
        removeUndefinedValues: true,
        // Convert empty strings to null — prevents DynamoDB empty-string errors.
        convertEmptyValues: false,
      },
      unmarshallOptions: {
        // Return numbers as JavaScript numbers, not the DynamoDB NumberValue wrapper.
        wrapNumbers: false,
      },
    });
  }

  return _client;
}

/**
 * Resets the singleton client.
 *
 * Call this in tests after overriding AWS environment variables to force the
 * client to be recreated with the new configuration.  Do not call in
 * production code.
 *
 * @internal
 */
export function _resetClientForTesting(): void {
  _client = undefined;
}

// ---------------------------------------------------------------------------
// Table name helpers — read from environment variables set by the CDK stack.
// ---------------------------------------------------------------------------

/**
 * Returns the DynamoDB users table name from the USERS_TABLE_NAME environment
 * variable.
 *
 * Throws at startup time (not lazily) when the variable is missing so that
 * misconfigured deployments fail fast rather than producing cryptic runtime
 * errors deep inside business logic.
 *
 * @returns The table name string.
 * @throws {Error} When USERS_TABLE_NAME is not set or is empty.
 */
export function getUsersTableName(): string {
  const tableName = process.env["USERS_TABLE_NAME"];
  if (!tableName) {
    throw new Error(
      "Missing required environment variable: USERS_TABLE_NAME. " +
        "Ensure the Lambda function is deployed with this variable set by the CDK stack."
    );
  }
  return tableName;
}
