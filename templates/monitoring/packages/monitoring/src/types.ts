/**
 * Types for the structured JSON logger used in Lambda handlers.
 */

/** Log severity levels — ordered from least to most severe. */
export type LogLevel = "debug" | "info" | "warn" | "error";

/** Numeric priority for each log level (lower = less severe). */
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * The structured log record emitted as a single JSON line to stdout.
 *
 * Fields are intentionally flat so that CloudWatch Logs Insights can
 * filter on any top-level field without needing JSON projection:
 *   `fields @timestamp, level, service, message, correlationId`
 */
export interface LogRecord {
  /** ISO-8601 timestamp produced at log time */
  timestamp: string;
  /** Log level: debug | info | warn | error */
  level: LogLevel;
  /** Service name passed to createLogger() */
  service: string;
  /** Human-readable message */
  message: string;
  /**
   * Optional correlation ID propagated from the Lambda request context or
   * the `X-Correlation-Id` / `X-Amzn-Trace-Id` request header.
   * Include this on every log line to enable cross-service trace reconstruction.
   */
  correlationId?: string;
  /** Any additional structured fields merged in by the caller */
  [key: string]: unknown;
}

/**
 * The logger interface returned by {@link createLogger}.
 *
 * Each method emits a single structured JSON line to stdout (CloudWatch
 * Logs captures stdout from Lambda).  Extra fields are merged into the log
 * record alongside `message`.
 *
 * @example
 * const log = createLogger("users-service");
 * log.info("User created", { userId: "u-123", email: "a@b.com" });
 * // { "timestamp": "...", "level": "info", "service": "users-service",
 * //   "message": "User created", "userId": "u-123", "email": "a@b.com" }
 */
export interface Logger {
  /** Verbose diagnostic info — suppressed unless LOG_LEVEL=debug */
  debug(message: string, extra?: Record<string, unknown>): void;
  /** Normal operational events (request handled, item persisted, etc.) */
  info(message: string, extra?: Record<string, unknown>): void;
  /** Non-fatal issues that should be investigated (retries, degraded state) */
  warn(message: string, extra?: Record<string, unknown>): void;
  /** Errors that need immediate attention */
  error(message: string, extra?: Record<string, unknown>): void;
  /**
   * Returns a child logger that always includes the provided fields in every
   * log record.  Useful for binding a correlationId for the duration of a
   * Lambda invocation without threading it through every call site.
   *
   * @example
   * const log = createLogger("users").withContext({ correlationId: event.requestContext.requestId });
   * log.info("Handler invoked"); // correlationId is included automatically
   */
  withContext(ctx: Record<string, unknown>): Logger;
}
