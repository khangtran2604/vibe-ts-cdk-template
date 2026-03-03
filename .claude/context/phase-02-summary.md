# Phase 2 Summary: Generator Templates

## Completed On
2026-03-03

## What Was Built

- `templates/infra/src/index.ts.hbs` — Added `// @module-inject:import` and `// @module-inject:instance` markers
- `templates/dev-gateway/src/gateway.ts` — Added `// @module-inject:route` marker inside ROUTES object
- `templates/generators/module/` — 16 template files for a complete CRUD service module:
  - `package.json.hbs` — Workspace package with lambda-utils/shared-types deps, Hono as devDep
  - `tsconfig.json.hbs` — Extends workspace tsconfig
  - `vitest.config.ts` — Node environment test config
  - `src/app.ts.hbs` — Hono router with 5 CRUD routes using lambdaToHono adapter
  - `src/dev-server.ts.hbs` — Local dev server on `{{port}}`
  - `src/store.ts.hbs` — In-memory `Map<string, {{EntityName}}>` store
  - `src/types/index.ts.hbs` — Entity, CreateBody, UpdateBody interfaces
  - `src/db/repository.ts.hbs` — Repository pattern with pagination support
  - `src/handlers/{create,get,list,update,delete}.ts.hbs` — Lambda handlers (no framework deps)
  - `src/__tests__/create.test.ts.hbs` — Unit test for create handler
  - `test/integration/api.test.ts.hbs` — Integration test with supertest on ephemeral port
- `templates/generators/infra-stack/stack.ts.hbs` — CDK stack with 5 Lambda functions, RestApi, LogGroup

## Key APIs (for downstream tasks)

- Marker comments for injection: `// @module-inject:import`, `// @module-inject:instance`, `// @module-inject:route`
- Template directory: `templates/generators/module/` — copy to `services/<moduleName>/`
- Infra stack template: `templates/generators/infra-stack/stack.ts.hbs` — copy to `infra/src/stacks/modules/`
- Handler filenames are generic (create.ts, get.ts, etc.) — no entity qualifier in filename

## Patterns Established

- Generator templates use generic handler filenames (create.ts, not create-entity.ts) since the module directory provides namespace
- Repository file named `repository.ts` (not entity-qualified) for same reason
- Store variable uses `{{flatLower}}` for unique per-module naming (e.g. `orderitems`)
- Repository variable uses `{{entityNameLower}}Repository` (e.g. `orderItemRepository`)

## Decisions Made

- Handler filenames are generic rather than entity-qualified — simplifies generator (no file-renaming logic needed)
- CDK stack entry paths reference generic handler names to match
- `repository.ts` uses generic name (diverges from users service's `user-repository.ts`) — acceptable since each module has its own directory

## Dependencies Added

None — all Phase 2 work is template files only.

## Known Limitations

- Unit test template only covers create handler (matches users service pattern; integration test covers all 5 endpoints)
- `entityName` and `EntityName` placeholders are always identical — both exist for template readability
