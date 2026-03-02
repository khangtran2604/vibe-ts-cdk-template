/**
 * Common API response shapes shared between Lambda handlers and frontend
 * clients.  Import these types in both service code and UI code via
 * `@<project>/shared-types`.
 */

// ---------------------------------------------------------------------------
// Success response
// ---------------------------------------------------------------------------

/**
 * Generic success response envelope.
 *
 * @template T - The shape of the `data` payload.
 *
 * @example
 * ```typescript
 * const response: ApiResponse<{ id: string }> = {
 *   success: true,
 *   data: { id: "abc" },
 * };
 * ```
 */
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  /** Optional human-readable message (e.g. "Created successfully"). */
  message?: string;
  /** ISO-8601 timestamp set by the handler. */
  timestamp?: string;
}

// ---------------------------------------------------------------------------
// Error response
// ---------------------------------------------------------------------------

/**
 * Structured error response returned by Lambda handlers on failure.
 *
 * The `code` field is a stable machine-readable identifier suitable for
 * programmatic error handling in the frontend (e.g. `"NOT_FOUND"`,
 * `"VALIDATION_ERROR"`).
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    /** Stable uppercase error code (e.g. "NOT_FOUND", "UNAUTHORIZED"). */
    code: string;
    /** Human-readable description safe to display to end users. */
    message: string;
    /** Optional field-level validation errors keyed by field name. */
    fieldErrors?: Record<string, string>;
  };
  /** ISO-8601 timestamp set by the handler. */
  timestamp?: string;
}

// ---------------------------------------------------------------------------
// Union helper
// ---------------------------------------------------------------------------

/** Either a success or an error response. */
export type ApiResult<T = unknown> = ApiResponse<T> | ApiErrorResponse;

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/**
 * Cursor-based pagination metadata included in list responses.
 *
 * @example
 * ```typescript
 * const response: ApiResponse<PaginatedResult<User>> = {
 *   success: true,
 *   data: {
 *     items: [...],
 *     pagination: { total: 100, limit: 20, cursor: "abc123", hasMore: true },
 *   },
 * };
 * ```
 */
export interface PaginationMeta {
  /** Total number of records available (before pagination). */
  total: number;
  /** Number of records per page. */
  limit: number;
  /** Opaque cursor for fetching the next page (absent when `hasMore` is false). */
  cursor?: string;
  /** Whether more records are available after this page. */
  hasMore: boolean;
}

/** A page of items together with pagination metadata. */
export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Common response factories (type-level helpers only — no runtime cost)
// ---------------------------------------------------------------------------

/** Helper to narrow a response as a success. */
export function isApiSuccess<T>(
  result: ApiResult<T>
): result is ApiResponse<T> {
  return result.success === true;
}

/** Helper to narrow a response as an error. */
export function isApiError(result: ApiResult): result is ApiErrorResponse {
  return result.success === false;
}
