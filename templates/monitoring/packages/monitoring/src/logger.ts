/**
 * Structured JSON logger for AWS Lambda handlers.
 *
 * Design goals:
 * - Zero dependencies — uses only Node.js built-ins.
 * - Every log line is a single JSON object → compatible with CloudWatch Logs
 *   Insights JSON queries and Log Metric Filters.
 * - Log level filtering via the LOG_LEVEL environment variable so verbosity
 *   can be tuned per stage without redeploying code.
 * - Correlation ID support: bind a requestId / traceId once per invocation
 *   and have it appear on every log line automatically.
 *
 * Usage in a Lambda handler:
 * ```ts
 * import { createLogger } from "@my-app/monitoring";
 *
 * const baseLog = createLogger("users-service");
 *
 * export const handler = async (event, context) => {
 *   // Bind per-invocation context (correlationId, etc.)
 *   const log = baseLog.withContext({
 *     correlationId: event.headers?.["x-correlation-id"] ?? context.awsRequestId,
 *   });
 *
 *   log.info("Handler invoked", { path: event.path });
 *   // ... handler logic ...
 * };
 * ```
 */

import type { Logger, LogLevel, LogRecord } from "./types.js";
import { LOG_LEVEL_PRIORITY } from "./types.js";

// ---------------------------------------------------------------------------
// Log level resolution
// ---------------------------------------------------------------------------

/**
 * Resolves the minimum log level from the LOG_LEVEL environment variable.
 *
 * Accepts: "debug" | "info" | "warn" | "error" (case-insensitive).
 * Defaults to "info" when unset or unrecognised so Lambda functions are not
 * silently verbose in production.
 */
function resolveMinLevel(): LogLevel {
  const raw = (process.env["LOG_LEVEL"] ?? "info").toLowerCase();
  if (raw in LOG_LEVEL_PRIORITY) return raw as LogLevel;
  return "info";
}

// ---------------------------------------------------------------------------
// Core emit function
// ---------------------------------------------------------------------------

/**
 * Serialises a log record to a single JSON line on stdout.
 *
 * CloudWatch Logs captures Lambda stdout line-by-line. Keeping each log
 * record as a single line (no newlines inside the JSON) ensures correct
 * line-level ingestion and avoids split records.
 *
 * `console.log` is used intentionally:  in Lambda, `process.stdout.write`
 * and `console.log` are both captured, but `console.log` appends the
 * newline separator automatically.
 */
function emit(record: LogRecord): void {
  // JSON.stringify does not throw for well-formed LogRecord objects because all
  // values are primitives or plain objects. If a caller passes an unserializable
  // extra field (e.g. a circular reference), we omit it rather than crashing.
  try {
    console.log(JSON.stringify(record));
  } catch {
    // Last-resort fallback: emit partial record without the extra fields
    console.log(
      JSON.stringify({
        timestamp: record.timestamp,
        level: record.level,
        service: record.service,
        message: record.message,
        correlationId: record.correlationId,
        _serializationError: true,
      })
    );
  }
}

// ---------------------------------------------------------------------------
// Logger factory
// ---------------------------------------------------------------------------

/**
 * Creates a structured JSON logger bound to the given service name.
 *
 * The returned logger reads LOG_LEVEL once per factory call so the minimum
 * level stays stable across an invocation.  Re-create the logger per service
 * (not per request) for lowest overhead.
 *
 * @param serviceName - Short identifier for the emitting service
 *   (e.g. "users-service", "auth-authorizer"). Appears on every log record.
 * @param baseContext - Optional key-value pairs included in every log record
 *   (e.g. version, environment). Typically populated via {@link Logger.withContext}.
 * @returns A {@link Logger} instance.
 */
export function createLogger(
  serviceName: string,
  baseContext: Record<string, unknown> = {}
): Logger {
  const minLevel = resolveMinLevel();

  function shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
  }

  function log(
    level: LogLevel,
    message: string,
    extra: Record<string, unknown> = {}
  ): void {
    if (!shouldLog(level)) return;

    const record: LogRecord = {
      timestamp: new Date().toISOString(),
      level,
      service: serviceName,
      message,
      // Spread baseContext first (lowest priority), then caller's extra fields
      // (higher priority), so callers can override baseContext values.
      ...baseContext,
      ...extra,
    };

    emit(record);
  }

  const logger: Logger = {
    debug: (message, extra) => log("debug", message, extra),
    info: (message, extra) => log("info", message, extra),
    warn: (message, extra) => log("warn", message, extra),
    error: (message, extra) => log("error", message, extra),

    withContext(ctx: Record<string, unknown>): Logger {
      // Merge ctx into a new baseContext — returned logger inherits all
      // previously bound context plus the new fields.
      return createLogger(serviceName, { ...baseContext, ...ctx });
    },
  };

  return logger;
}
