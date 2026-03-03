/**
 * OpenAPI route registration for the health service.
 *
 * This module defines all routes exposed by the health service in a form that
 * can be converted to an OpenAPI 3.1 specification via
 * `@asteasolutions/zod-to-openapi`.  It is intentionally kept separate from
 * the Lambda handler so that spec generation remains a build-time concern with
 * no runtime overhead.
 *
 * Usage: import `registry` into the spec-generation script and call
 * `OpenApiGeneratorV31.prototype.generateDocument` (or similar) to produce the
 * final JSON/YAML document.
 */

import { z } from "zod";
import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";

// Enable the `.openapi()` method on every Zod type.  Idempotent — safe to call
// in every schema module regardless of import order.
extendZodWithOpenApi(z);

// ---------------------------------------------------------------------------
// Health response data schema
// ---------------------------------------------------------------------------

/**
 * The `data` payload returned by GET /health.
 *
 * Mirrors the literal body shape emitted by the health Lambda handler:
 * `{ status: "ok", timestamp: <ISO-8601> }`.
 */
const HealthDataSchema = z
  .object({
    /** Always `"ok"` — signals the service is running and responsive. */
    status: z.literal("ok"),
    /** ISO-8601 datetime string captured at handler invocation time. */
    timestamp: z.iso.datetime(),
  })
  .openapi("HealthData");

// The health handler returns a flat response (no ApiResponse envelope), so we
// use the HealthData schema directly as the documented response body.
const HealthResponseSchema = HealthDataSchema;

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * OpenAPI registry for the health service.
 *
 * Import this in the spec-generation script:
 * ```typescript
 * import { registry } from "./openapi.js";
 * ```
 */
export const registry = new OpenAPIRegistry();

registry.registerPath({
  method: "get",
  path: "/health",
  summary: "Health check",
  description:
    "Returns a 200 response confirming the service is alive and its clock is functioning.",
  tags: ["Health"],
  responses: {
    200: {
      description: "Service is healthy.",
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
    },
  },
});
