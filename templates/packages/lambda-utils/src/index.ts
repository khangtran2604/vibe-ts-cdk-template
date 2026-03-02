/**
 * @packageDocumentation
 * lambda-utils — shared utilities for wrapping Lambda handlers as Hono routes
 * and for building test fixtures.
 */

export { lambdaToHono } from "./lambda-adapter.js";
export type { LambdaHandler } from "./lambda-adapter.js";
export { errorHandler } from "./middleware/error-handler.js";
export { createMockEvent } from "./test-utils/mock-event.js";
