/**
 * @packageDocumentation
 * utils — shared runtime utilities for Lambda handlers and Node.js packages.
 *
 * Keep this package free of framework-specific dependencies so it can be
 * imported by any workspace member without pulling in heavy transitive deps.
 */

// ---------------------------------------------------------------------------
// JSON helpers
// ---------------------------------------------------------------------------

/**
 * Serialises `value` to a JSON string.  Returns `null` (not a thrown error)
 * when serialisation fails (e.g. circular references), so callers can decide
 * how to handle the failure without try/catch at every call site.
 *
 * @param value - Any JSON-serialisable value.
 * @returns The JSON string, or `null` on failure.
 */
export function safeJsonStringify(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

/**
 * Parses a JSON string and returns the parsed value, or `null` on failure.
 * Avoids the need for try/catch at every JSON.parse call site.
 *
 * @param raw - The JSON string to parse.
 * @returns The parsed value, or `null` if the string is not valid JSON.
 */
export function safeJsonParse<T = unknown>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Lambda response builder
// ---------------------------------------------------------------------------

/**
 * Builds a well-formed API Gateway proxy response with JSON body and standard
 * CORS headers pre-applied.
 *
 * @param statusCode - HTTP status code (e.g. 200, 400, 500).
 * @param body       - Value to serialise as the response body.
 * @param headers    - Optional additional headers to merge in.
 * @returns An `APIGatewayProxyResult`-compatible object.
 */
export function buildJsonResponse(
  statusCode: number,
  body: unknown,
  headers?: Record<string, string>
): { statusCode: number; headers: Record<string, string>; body: string } {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

// ---------------------------------------------------------------------------
// String utilities
// ---------------------------------------------------------------------------

/**
 * Converts a string to `kebab-case`.
 * Useful for slugifying project names or resource identifiers.
 *
 * @example
 * toKebabCase("MyProject Name") // "my-project-name"
 * toKebabCase("hello_world")    // "hello-world"
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/**
 * Returns `true` when `value` is a non-empty string (after trimming).
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

// ---------------------------------------------------------------------------
// Environment variable helpers
// ---------------------------------------------------------------------------

/**
 * Reads a required environment variable.  Throws a descriptive error at
 * startup time rather than producing a confusing `undefined` deep inside
 * business logic.
 *
 * @param name - The environment variable name.
 * @returns The variable value.
 * @throws {Error} When the variable is not set or is an empty string.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it before starting the service.`
    );
  }
  return value;
}

/**
 * Reads an optional environment variable, returning `fallback` when absent.
 *
 * @param name     - The environment variable name.
 * @param fallback - Value to return when the variable is not set.
 * @returns The variable value or the fallback.
 */
export function getEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

// ---------------------------------------------------------------------------
// Async utilities
// ---------------------------------------------------------------------------

/**
 * Pauses execution for `ms` milliseconds.
 * Use sparingly — prefer proper retry/backoff libraries in production code.
 *
 * @param ms - Duration in milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
