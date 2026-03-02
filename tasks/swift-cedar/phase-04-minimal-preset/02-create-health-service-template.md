# Task: Create health service template

## ID
4.2

## Description
Create the `templates/services/health/` directory with a complete health check microservice. This includes the Lambda handler, Hono dev server, vitest configuration, and unit tests. The health service is the simplest service and serves as the pattern for other services.

## Dependencies
- Task 3.5: Base templates for consistent config patterns
- Task 4.5: packages/lambda-utils must exist for the `lambdaToHono` adapter used in dev-server

## Inputs
- Service structure from PLAN.md: handlers/, dev-server.ts, __tests__/
- Port assignment: health = 3001
- Variables: `{{projectName}}`

## Outputs / Deliverables
- `templates/services/health/package.json.hbs`
- `templates/services/health/tsconfig.json`
- `templates/services/health/vitest.config.ts`
- `templates/services/health/src/handlers/health.ts`
- `templates/services/health/src/dev-server.ts.hbs`
- `templates/services/health/src/__tests__/health.test.ts`

## Acceptance Criteria
- [ ] Lambda handler returns `{ statusCode: 200, body: JSON.stringify({ status: "ok", timestamp }) }`
- [ ] Dev server uses Hono with `lambdaToHono` adapter on port 3001
- [ ] `hono` and `@hono/node-server` are devDependencies only
- [ ] `@types/aws-lambda` is a devDependency
- [ ] Unit test creates a mock `APIGatewayProxyEvent` and verifies handler response
- [ ] `package.json` scripts include: `dev` (tsx watch), `build` (tsc), `test` (vitest)
- [ ] tsconfig extends from shared tsconfig package

## Implementation Notes
- The handler is the PRIMARY code deployed to Lambda -- keep it pure with no framework dependencies
- Hono dev-server is for local development only, never shipped to Lambda
- Use `tsx watch` for the dev script to enable hot reload
- The test should import the handler directly and pass a minimal mock event
- Consider using `@{{projectName}}/lambda-utils` package reference in dev-server

## Estimated Complexity
Medium -- Complete microservice workspace with handler, dev server, and tests

## Status
- [ ] Not Started
