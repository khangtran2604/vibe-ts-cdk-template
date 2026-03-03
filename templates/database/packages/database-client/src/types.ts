/**
 * DynamoDB entity types for the database-client package.
 *
 * The users table uses a single-table design with pk/sk keys and a GSI on
 * email for lookups by email address.
 *
 * Key schema:
 *   pk  (HASH)   — entity prefix + ID, e.g. "USER#<uuid>"
 *   sk  (RANGE)  — metadata suffix, e.g. "PROFILE#<uuid>"
 *
 * GSI (EmailIndex):
 *   gsi1pk — "EMAIL#<email>"  (HASH)
 *   gsi1sk — "USER#<uuid>"   (RANGE)
 */

// ---------------------------------------------------------------------------
// Base DynamoDB item
// ---------------------------------------------------------------------------

/**
 * Attributes shared by every item stored in the table.
 * All items must carry the pk/sk key pair plus the GSI projection attributes.
 */
export interface DynamoItem {
  /** Partition key — format: "<TYPE>#<id>" (e.g. "USER#abc123") */
  pk: string;
  /** Sort key — format: "<TYPE>#<id>" (e.g. "PROFILE#abc123") */
  sk: string;
  /** GSI-1 partition key — used for email index (e.g. "EMAIL#user@example.com") */
  gsi1pk?: string;
  /** GSI-1 sort key — used for email index (e.g. "USER#abc123") */
  gsi1sk?: string;
  /** ISO-8601 timestamp when the item was created */
  createdAt: string;
  /** ISO-8601 timestamp when the item was last updated */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// User entity
// ---------------------------------------------------------------------------

/**
 * A user entity as stored in DynamoDB.
 *
 * pk  = "USER#<id>"
 * sk  = "PROFILE#<id>"
 * gsi1pk = "EMAIL#<email>"
 * gsi1sk = "USER#<id>"
 */
export interface UserItem extends DynamoItem {
  /** User UUID — matches the ID portion of pk/sk */
  id: string;
  /** Display name */
  name: string;
  /** Unique email address (also the GSI key) */
  email: string;
}

// ---------------------------------------------------------------------------
// Repository input/output shapes
// ---------------------------------------------------------------------------

/** Input for creating a new user */
export interface CreateUserInput {
  name: string;
  email: string;
}

/** Result of a paginated list query */
export interface ListResult<T> {
  /** The items for the current page */
  items: T[];
  /** Total item count (if available; DynamoDB scans can return an estimate) */
  total: number;
  /**
   * Opaque pagination cursor.  Pass this as the `cursor` argument in the next
   * call to retrieve the following page.  `undefined` means no more pages.
   */
  cursor?: string;
}
