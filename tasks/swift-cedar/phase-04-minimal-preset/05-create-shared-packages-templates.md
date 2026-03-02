# Task: Create shared packages templates

## ID
4.5

## Description
Create the `templates/packages/` directory with shared monorepo packages: lambda-utils (adapter + middleware), shared-types, utils, eslint-config, and tsconfig. These packages are workspace dependencies used by services and other workspaces.

## Dependencies
- Task 3.5: Base templates must exist for consistent config patterns

## Inputs
- Package structure from PLAN.md
- Variables: `{{projectName}}`
- Lambda adapter pattern: Hono request <-> Lambda event conversion

## Outputs / Deliverables
- `templates/packages/lambda-utils/` -- Lambda adapter, error handler middleware, test utilities
- `templates/packages/shared-types/` -- Shared TypeScript type definitions
- `templates/packages/utils/` -- Common utility functions
- `templates/packages/eslint-config/` -- Shared ESLint configuration
- `templates/packages/tsconfig/` -- Shared TypeScript configs (base, node, react)

## Acceptance Criteria
- [ ] `lambda-utils` exports `lambdaToHono()` adapter function for wrapping Lambda handlers as Hono routes
- [ ] `lambda-utils` exports error handler middleware
- [ ] `lambda-utils` includes `test-utils/mock-event.ts` for creating mock APIGatewayProxyEvents
- [ ] `shared-types` exports common interfaces (API response types, etc.)
- [ ] `utils` exports shared utility functions
- [ ] `eslint-config` provides a reusable ESLint flat config
- [ ] `tsconfig` provides base, node, and react config files
- [ ] All packages have correct `package.json` with `name: "@{{projectName}}/<pkg>"`
- [ ] Packages reference each other correctly using workspace protocol (`workspace:*`)

## Implementation Notes
- `lambdaToHono` should convert Hono Request to APIGatewayProxyEvent and back -- this is the core dev-server utility
- `mock-event.ts` creates minimal valid APIGatewayProxyEvent objects for testing
- ESLint config should use the flat config format (eslint.config.js) with TypeScript support
- tsconfig/base.json should contain strict TypeScript settings; node.json and react.json extend it
- All packages should use `"type": "module"` and have `"main"` / `"types"` / `"exports"` fields

## Estimated Complexity
High -- Multiple packages with inter-dependencies and utility implementations

## Status
- [ ] Not Started
