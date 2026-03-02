/**
 * Thin logging wrapper around `@clack/prompts` log methods.
 *
 * Keeping all clack log calls in one place means:
 * - Call sites stay readable: `logger.info("msg")` vs `clack.log.info("msg")`.
 * - The abstraction is easy to swap out (e.g. to a structured logger) without
 *   touching every file.
 * - clack-specific imports don't spread across the whole codebase.
 *
 * This module intentionally stays trivial.  Do not add formatting, prefixes, or
 * log levels here — clack's built-in styling is sufficient.
 */

import * as clack from "@clack/prompts";

/**
 * Log an informational message.
 *
 * Renders with clack's `─` step indicator.
 */
export function info(message: string): void {
  clack.log.info(message);
}

/**
 * Log a success message.
 *
 * Renders with clack's green checkmark indicator.
 */
export function success(message: string): void {
  clack.log.success(message);
}

/**
 * Log a warning message.
 *
 * Renders with clack's yellow warning indicator.
 */
export function warn(message: string): void {
  clack.log.warn(message);
}

/**
 * Log an error message.
 *
 * Renders with clack's red error indicator.  This does NOT exit the process —
 * callers are responsible for deciding whether execution should continue.
 */
export function error(message: string): void {
  clack.log.error(message);
}
