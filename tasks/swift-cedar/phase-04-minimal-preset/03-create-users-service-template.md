# Task: Create users service template

## ID
4.3

## Description
Create the `templates/services/users/` directory with a full CRUD users microservice. This includes Lambda handlers for create, get, list, update, and delete operations, a Hono dev server, types, and both unit and integration tests.

## Dependencies
- Task 4.2: Health service as reference pattern
- Task 4.5: packages/lambda-utils for lambdaToHono adapter

## Inputs
- Service structure from PLAN.md with CRUD handlers
- Port assignment: users = 3002
- Variables: `{{projectName}}`

## Outputs / Deliverables
- `templates/services/users/package.json.hbs`
- `templates/services/users/tsconfig.json`
- `templates/services/users/vitest.config.ts`
- `templates/services/users/src/handlers/create-user.ts`
- `templates/services/users/src/handlers/get-user.ts`
- `templates/services/users/src/handlers/list-users.ts`
- `templates/services/users/src/handlers/update-user.ts`
- `templates/services/users/src/handlers/delete-user.ts`
- `templates/services/users/src/types/index.ts`
- `templates/services/users/src/dev-server.ts.hbs`
- `templates/services/users/src/__tests__/create-user.test.ts`
- `templates/services/users/test/integration/api.test.ts`

## Acceptance Criteria
- [ ] All 5 CRUD handlers follow the Lambda handler pattern (APIGatewayProxyEvent -> APIGatewayProxyResult)
- [ ] Handlers use in-memory storage (no database dependency in minimal preset)
- [ ] Dev server maps routes: POST /users, GET /users/:id, GET /users, PUT /users/:id, DELETE /users/:id
- [ ] Unit test verifies create-user handler with mock event
- [ ] Integration test uses supertest to hit Hono app endpoints
- [ ] `hono` and `@hono/node-server` are devDependencies, `supertest` is devDependency
- [ ] Types define `User` interface and request/response types

## Implementation Notes
- Handlers should use in-memory Map/array for storage -- database integration comes in Phase 6
- Each handler should return proper status codes: 201 (create), 200 (get/list/update), 204 (delete), 404 (not found)
- The integration test should use supertest against the Hono app instance (not running server)
- Include `// @feature:database` conditionals where database imports would go (prepared for Phase 6)

## Estimated Complexity
High -- Multiple handlers with routing, types, and both unit + integration tests

## Status
- [ ] Not Started
