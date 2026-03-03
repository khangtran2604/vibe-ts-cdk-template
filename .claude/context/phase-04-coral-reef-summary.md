# Phase 4 Summary: OpenAPI Spec Generation

## Completed On
2026-03-03

## What Was Built
- `templates/services/users/src/openapi.ts` — OpenAPIRegistry with all 5 CRUD endpoints (POST, GET list, GET by id, PUT, DELETE)
- `templates/generators/module/src/openapi.ts.hbs` — Templated OpenAPIRegistry with {{EntityName}}/{{moduleName}} variables
- `templates/services/health/src/openapi.ts` — OpenAPIRegistry with GET /health endpoint (flat response, no envelope)
- `templates/services/users/src/generate-spec.ts` — Build-time script producing dist/openapi.json
- `templates/services/health/src/generate-spec.ts` — Build-time script producing dist/openapi.json
- `templates/generators/module/src/generate-spec.ts.hbs` — Templated build-time script
- Modified `templates/services/users/package.json.hbs` — Added generate:openapi script, chained build
- Modified `templates/services/health/package.json.hbs` — Added generate:openapi script, chained build, added zod dep
- Modified `templates/generators/module/package.json.hbs` — Added generate:openapi script, chained build
- `test/openapi-spec-generation.test.ts` — 86 tests covering all new files

## Key APIs (for downstream tasks)
- `registry` (exported from each service's `openapi.ts`) — `OpenAPIRegistry` instance consumed by generate-spec.ts
- `generate-spec.ts` — Run via `tsx src/generate-spec.ts`, outputs `dist/openapi.json`
- Build chain: `tsc --build && tsx src/generate-spec.ts` — spec generation runs after TypeScript compilation
- `generate:openapi` script — standalone way to regenerate spec without full build

## Patterns Established
- OpenAPI registration pattern: separate `openapi.ts` (registry definitions) from `generate-spec.ts` (generation script)
- `extendZodWithOpenApi(z)` called at top of every openapi.ts module (idempotent)
- Shared-types imported via main entry `@{{projectName}}/shared-types` (NOT subpath `/schemas`)
- DELETE endpoints use 204 No Content (matching actual handler behavior)
- Health endpoint uses flat response schema (no ApiResponse envelope) — matches actual handler output
- `OpenApiGeneratorV31` with `openapi: "3.1.0"` for spec generation

## Decisions Made
- DELETE returns 204 (not 200 with body) — aligned with actual handler behavior over task spec
- Health response documented as flat `{ status, timestamp }` — handler doesn't use ApiResponse envelope
- `@asteasolutions/zod-to-openapi` stays in `dependencies` for users/module (schemas import it at module load) but `devDependencies` for health
- `zod` added to health service dependencies (needed by openapi.ts inline schema)

## Dependencies Added
- `zod@4.3.6` — added to health service dependencies (was already in users/module from Phase 1)
- `@asteasolutions/zod-to-openapi@8.4.3` — added to health service devDependencies

## Known Limitations
- Template files show IDE TS errors (expected — deps resolve in generated projects, not in CLI repo)
- Health service openapi.ts defines inline HealthDataSchema rather than importing from a schemas module
