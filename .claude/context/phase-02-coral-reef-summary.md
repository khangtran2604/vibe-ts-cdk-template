# Phase 2 Summary: Service Schemas

## Completed On
2026-03-03

## What Was Built
- `templates/services/users/src/schemas/index.ts` — Zod schemas for User, CreateUserBody, UpdateUserBody with OpenAPI registration
- `templates/generators/module/src/schemas/index.ts.hbs` — Templated Zod schemas for module generator ({{EntityName}} pattern)
- `templates/services/users/src/types/index.ts` — Re-exports types from schemas (backward-compatible)
- `templates/generators/module/src/types/index.ts.hbs` — Re-exports templated types from schemas
- `templates/services/users/package.json.hbs` — Added zod + zod-to-openapi dependencies
- `templates/generators/module/package.json.hbs` — Added zod + zod-to-openapi dependencies
- `test/service-schemas.test.ts` — 80 tests covering all schema files, types re-exports, and package deps

## Key APIs (for downstream tasks)
- `UserSchema` — Zod object: id (uuid), name (min 1), email (email), createdAt/updatedAt (datetime)
- `CreateUserBodySchema` — Zod object: name (min 1), email (email)
- `UpdateUserBodySchema` — Zod object: name (optional), email (optional)
- `{{EntityName}}Schema` — Module template: id (uuid), name (min 1), createdAt/updatedAt (datetime)
- `Create{{EntityName}}BodySchema` — Module template: name (min 1)
- `Update{{EntityName}}BodySchema` — Module template: name (optional)
- All schemas registered via `.openapi("Name")` for OpenAPI spec generation

## Patterns Established
- Per-service schema files at `src/schemas/index.ts` — each service owns its entity schemas
- Types barrel (`types/index.ts`) re-exports from schemas via `export type { ... }` — preserves all import paths
- Services declare `zod` + `@asteasolutions/zod-to-openapi` as direct dependencies (not just via shared-types)
- `extendZodWithOpenApi(z)` called in every schema module with "idempotent" comment

## Decisions Made
- Module generator entities have only `name` field (no email) — matches existing template convention
- UpdateBody schemas use `.min(1).optional()` — rejects empty strings when field is provided
- No `satisfies` guards in service schemas — types ARE derived from schemas (unlike shared-types where schemas mirror existing interfaces)

## Dependencies Added
- `zod@4.3.6` — Added to users and module generator package.json.hbs
- `@asteasolutions/zod-to-openapi@8.4.3` — Added to users and module generator package.json.hbs

## Known Limitations
- Template files show TS2307 in IDE (expected — deps resolve in generated projects)
- Zod v4 `z.iso.email()`/`z.iso.uuid()`/`z.iso.datetime()` branded type behavior should be verified in full scaffolding loop
