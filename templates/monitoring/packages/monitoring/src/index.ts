/**
 * @packageDocumentation
 * monitoring — structured JSON logging utilities for Lambda handlers.
 *
 * Provides a zero-dependency logger that emits newline-delimited JSON to
 * stdout, compatible with CloudWatch Logs Insights and Log Metric Filters.
 *
 * @example
 * ```ts
 * import { createLogger } from "@my-app/monitoring";
 *
 * const log = createLogger("users-service");
 *
 * export const handler = async (event, context) => {
 *   const reqLog = log.withContext({
 *     correlationId: event.headers?.["x-correlation-id"] ?? context.awsRequestId,
 *   });
 *   reqLog.info("Handler invoked");
 * };
 * ```
 */

export { createLogger } from "./logger.js";
export type { Logger, LogLevel, LogRecord } from "./types.js";
