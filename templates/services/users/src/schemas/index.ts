/**
 * Zod schemas for the users service.
 *
 * These schemas serve a dual purpose:
 *   1. Runtime validation of request bodies and response payloads.
 *   2. OpenAPI document generation via `@asteasolutions/zod-to-openapi`.
 *
 * TypeScript types are derived from the schemas so they stay in sync
 * with runtime validation automatically.
 */

import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Enable the `.openapi()` method on every Zod type.  Idempotent — safe to call
// in every schema module regardless of import order.
extendZodWithOpenApi(z);

// ---------------------------------------------------------------------------
// User domain schema
// ---------------------------------------------------------------------------

/**
 * Full user record as stored in the service and returned by read endpoints.
 *
 * `id` is a UUID v4 generated at creation time.
 * `createdAt` and `updatedAt` are ISO-8601 datetime strings set by the server.
 */
export const UserSchema = z
  .object({
    id: z.iso.uuid(),
    name: z.string().min(1),
    email: z.iso.email(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .openapi("User");

// ---------------------------------------------------------------------------
// Request body schemas
// ---------------------------------------------------------------------------

/**
 * Request body accepted when creating a new user.
 *
 * The `id`, `createdAt`, and `updatedAt` fields are server-generated and
 * must not be supplied by the caller.
 */
export const CreateUserBodySchema = z
  .object({
    name: z.string().min(1),
    email: z.iso.email(),
  })
  .openapi("CreateUserBody");

/**
 * Request body accepted when updating an existing user.
 *
 * All fields are optional — only the provided fields are changed.
 * At least one field should be present, but enforcement is left to the
 * handler to keep the schema simple and the error message readable.
 */
export const UpdateUserBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.iso.email().optional(),
  })
  .openapi("UpdateUserBody");

// ---------------------------------------------------------------------------
// Inferred TypeScript types
// ---------------------------------------------------------------------------

/** A user record stored in the service. */
export type User = z.infer<typeof UserSchema>;

/** Fields accepted when creating a new user. */
export type CreateUserBody = z.infer<typeof CreateUserBodySchema>;

/** Fields accepted when updating an existing user. */
export type UpdateUserBody = z.infer<typeof UpdateUserBodySchema>;
