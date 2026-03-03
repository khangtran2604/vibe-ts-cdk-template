/**
 * Zod schemas that mirror the TypeScript interfaces in `api.ts`.
 *
 * These schemas serve a dual purpose:
 *   1. Runtime validation of API payloads (both inbound and outbound).
 *   2. OpenAPI document generation via `@asteasolutions/zod-to-openapi`.
 *
 * Import these in Lambda handlers and OpenAPI registry code via
 * `@<project>/shared-types`.
 */

import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Register the `.openapi()` extension on every Zod type.  Must be called once
// before any schema that uses `.openapi()` is constructed.
extendZodWithOpenApi(z);

// ---------------------------------------------------------------------------
// Success response
// ---------------------------------------------------------------------------

/**
 * Generic success response envelope schema.
 *
 * Pass the schema for the `data` payload to get a fully-typed, validated
 * response object.
 *
 * @param dataSchema - A Zod schema describing the `data` field.
 * @returns A Zod object schema whose inferred type matches `ApiResponse<T>`.
 *
 * @example
 * ```typescript
 * const UserResponseSchema = ApiResponseSchema(UserSchema);
 * type UserResponse = z.infer<typeof UserResponseSchema>;
 * ```
 */
export function ApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    /** Optional human-readable message (e.g. "Created successfully"). */
    message: z.string().optional(),
    /** ISO-8601 timestamp set by the handler. */
    timestamp: z.iso.datetime().optional(),
  });
}

// ---------------------------------------------------------------------------
// Error response
// ---------------------------------------------------------------------------

/**
 * Structured error response schema returned by Lambda handlers on failure.
 *
 * The `success: false` literal acts as a discriminant that TypeScript (and
 * Zod) use to narrow the `ApiResult` union without an explicit type guard.
 */
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    /** Stable uppercase error code (e.g. "NOT_FOUND", "UNAUTHORIZED"). */
    code: z.string(),
    /** Human-readable description safe to display to end users. */
    message: z.string(),
    /** Optional field-level validation errors keyed by field name. */
    fieldErrors: z.record(z.string(), z.string()).optional(),
  }),
  /** ISO-8601 timestamp set by the handler. */
  timestamp: z.iso.datetime().optional(),
});

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/**
 * Cursor-based pagination metadata schema included in list responses.
 *
 * Mirrors the `PaginationMeta` interface from `api.ts`.
 */
export const PaginationMetaSchema = z.object({
  /** Total number of records available (before pagination). */
  total: z.number().int(),
  /** Number of records per page. */
  limit: z.number().int(),
  /** Opaque cursor for fetching the next page (absent when `hasMore` is false). */
  cursor: z.string().optional(),
  /** Whether more records are available after this page. */
  hasMore: z.boolean(),
});

/**
 * Generic paginated result schema.
 *
 * Wraps an array of items alongside `PaginationMetaSchema` and mirrors the
 * `PaginatedResult<T>` interface from `api.ts`.
 *
 * @param itemSchema - A Zod schema describing a single item in the list.
 * @returns A Zod object schema whose inferred type matches `PaginatedResult<T>`.
 *
 * @example
 * ```typescript
 * const UsersPageSchema = PaginatedResultSchema(UserSchema);
 * const UsersListResponseSchema = ApiResponseSchema(UsersPageSchema);
 * ```
 */
export function PaginatedResultSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    pagination: PaginationMetaSchema,
  });
}

// ---------------------------------------------------------------------------
// Compile-time guards: ensure schemas stay in sync with interfaces
// ---------------------------------------------------------------------------

import type {
  ApiErrorResponse,
  ApiResponse,
  PaginatedResult,
  PaginationMeta,
} from "./api.js";

/** @internal Zero-cost assertion — fails at build time if schemas drift from interfaces. */
null as unknown as z.infer<typeof ApiErrorResponseSchema> satisfies ApiErrorResponse;
null as unknown as z.infer<typeof PaginationMetaSchema> satisfies PaginationMeta;
null as unknown as z.infer<
  ReturnType<typeof ApiResponseSchema<z.ZodString>>
> satisfies ApiResponse<string>;
null as unknown as z.infer<
  ReturnType<typeof PaginatedResultSchema<z.ZodString>>
> satisfies PaginatedResult<string>;
