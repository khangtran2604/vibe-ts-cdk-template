/**
 * @packageDocumentation
 * database-client — shared typed DynamoDB client and entity types.
 *
 * Provides:
 * - A singleton DocumentClient configured for the deployment region.
 * - Table name helpers that read from Lambda environment variables.
 * - TypeScript entity types for all DynamoDB items in this project.
 *
 * Import this package from any service Lambda that needs DynamoDB access.
 */

// Client
export { getDocumentClient, getUsersTableName } from "./dynamo-client.js";

// Types
export type {
  DynamoItem,
  UserItem,
  CreateUserInput,
  ListResult,
} from "./types.js";
