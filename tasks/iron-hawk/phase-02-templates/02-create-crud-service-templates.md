# Task: Create CRUD Service Module Templates

## ID
2.2

## Description
Create the generator template files under `templates/generators/module/` that define a complete CRUD service module. These templates will be copied into a scaffolded project's `services/<moduleName>/` directory and have their `{{variable}}` placeholders replaced with actual values.

## Dependencies
- Task 1.2: Needs the variable map keys from `getModuleVariableMap()` to use correct placeholder names

## Inputs
- Variable map keys: `moduleName`, `ModuleName`, `entityName`, `EntityName`, `entityNameLower`, `flatLower`, `port`, `projectName`
- Existing `templates/services/users/` as reference for patterns, structure, and conventions
- Template conventions from CLAUDE.md: `.hbs` suffix for files with placeholders, `_` prefix for dotfiles

## Outputs / Deliverables
New directory `templates/generators/module/` with 14 files:
- `package.json.hbs`
- `tsconfig.json.hbs`
- `vitest.config.ts`
- `src/app.ts.hbs` -- Hono router with CRUD routes
- `src/dev-server.ts.hbs` -- Local dev server on `{{port}}`
- `src/store.ts.hbs` -- In-memory Map store
- `src/types/index.ts.hbs` -- Entity types
- `src/db/repository.ts.hbs` -- Repository pattern over store
- `src/handlers/create.ts.hbs` -- POST handler
- `src/handlers/get.ts.hbs` -- GET by ID handler
- `src/handlers/list.ts.hbs` -- GET all handler
- `src/handlers/update.ts.hbs` -- PUT handler
- `src/handlers/delete.ts.hbs` -- DELETE handler
- `src/__tests__/create.test.ts.hbs` -- Unit test for create handler
- `test/integration/api.test.ts.hbs` -- Integration test

## Acceptance Criteria
- [ ] All 14+ template files exist under `templates/generators/module/`
- [ ] `package.json.hbs` references `@{{projectName}}/lambda-utils` and `@{{projectName}}/types` as workspace dependencies
- [ ] `package.json.hbs` has Hono as a devDependency (not production dependency, per CLAUDE.md rules)
- [ ] Handlers follow the Lambda handler pattern (export `handler` as `APIGatewayProxyHandler`)
- [ ] `app.ts.hbs` creates a Hono app with routes: POST `/{{moduleName}}`, GET `/{{moduleName}}/:id`, GET `/{{moduleName}}`, PUT `/{{moduleName}}/:id`, DELETE `/{{moduleName}}/:id`
- [ ] `dev-server.ts.hbs` serves on port `{{port}}`
- [ ] `store.ts.hbs` implements an in-memory `Map<string, {{EntityName}}>` store
- [ ] `repository.ts.hbs` implements CRUD operations over the store
- [ ] `types/index.ts.hbs` exports `{{EntityName}}`, `Create{{EntityName}}Body`, `Update{{EntityName}}Body` interfaces
- [ ] Templates follow the same patterns as `templates/services/users/` (same tsconfig structure, same test patterns, etc.)
- [ ] All `.hbs` files use only `{{variable}}` placeholders that exist in the variable map

## Implementation Notes
- Study `templates/services/users/` thoroughly before creating these templates. The generated module should feel consistent with existing services.
- Hono is a devDependency used only for the dev-server; Lambda handlers are the primary code.
- The in-memory store is a placeholder -- real projects would replace it with DynamoDB or RDS. Keep it simple with a `Map`.
- Use `crypto.randomUUID()` for generating IDs in the create handler.
- The entity type should have `id: string`, `createdAt: string`, `updatedAt: string` plus a generic `name: string` field as a minimal example.

## Estimated Complexity
High -- 14 template files that must be internally consistent, follow existing conventions, and use correct placeholders.

## Status
- [ ] Not Started
