/**
 * @packageDocumentation
 * shared-types — common TypeScript interfaces and type guards used by Lambda
 * handlers, frontend code, and integration tests.
 */

export type {
  ApiResponse,
  ApiErrorResponse,
  ApiResult,
  PaginationMeta,
  PaginatedResult,
} from "./api.js";

export { isApiSuccess, isApiError } from "./api.js";
