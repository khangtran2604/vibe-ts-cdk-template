# Template Conventions (detailed)

See MEMORY.md for summary. Full conventions documented here.

## packages/ template conventions
- All package `tsconfig.json` files contain `"extends": "@{{projectName}}/tsconfig/node.json"` →
  must use `.hbs` extension so the placeholder gets replaced. Plain `tsconfig.json` with
  `{{...}}` won't be substituted.
- `tsconfig` package: no `type:module`, no scripts, no devDeps — just `exports` for each .json.
- `eslint-config` package: ships plain JS (`src/index.js`) as the entrypoint — no build step.
  Uses `dependencies` (not devDependencies) for `@eslint/js` and `typescript-eslint` so consumers
  don't have to install them separately.
- `lambda-utils`: `hono` is a **devDependency only** (only used for the adapter type/import in
  dev-server context); `@types/aws-lambda` is also devDep (types only, not runtime).
- Packages that depend on each other would use `workspace:*` protocol in package.json. None of
  the 5 packages depend on each other at runtime (tsconfig extends are TypeScript-level, not npm deps).
- Every package that extends `@{{projectName}}/tsconfig/node.json` MUST declare
  `"@{{projectName}}/tsconfig": "workspace:*"` as a devDependency — TypeScript resolves
  `extends` through node_modules. Missing this causes `TS6053: File not found`.
- Packages using Node.js globals (process, console, Buffer, NodeJS.ErrnoException) MUST include
  `"@types/node": "22.x"` as a devDependency. This affects: utils, lambda-utils, health, users,
  dev-gateway, auth. The infra package already includes it.
- `utils` and `lambda-utils` have a `test` script but no test files — their vitest configs use
  `passWithNoTests: true` so the test pipeline doesn't fail on empty packages.
- Service vitest configs must include `exclude: ["dist/**", "**/node_modules/**"]` to prevent
  compiled `.js` test files from being double-run alongside the `.ts` source tests.
- `lambdaToHono()` return type must be explicitly annotated as
  `(c: Context) => Promise<Response>` to avoid TS2742 "cannot be named without a reference
  to undici-types" when `@types/node` is present (its fetch types reference undici-types).
- Root `package.json` must include `"packageManager": "pnpm@<version>"` — Turbo 2.8.12+
  requires this field to resolve workspaces (fails with "Missing packageManager field").
- `aws-cdk` CLI package version (2.1108.0) is separate from `aws-cdk-lib` (2.241.0).
  The CLI versioning runs much higher — always verify with `npm view aws-cdk version`.

## services/ template conventions
- Each service has: `package.json.hbs`, `tsconfig.json.hbs`, `vitest.config.ts`, `src/handlers/`, `src/__tests__/`, `test/integration/`.
- Handler signature: `(event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>`. Zero framework deps.
- In-memory store: module-level `Map` exported from `src/store.ts` — shared across all handlers in the same process.
- Dev server pattern: `src/app.ts.hbs` exports the Hono app (shared between dev-server and integration tests); `src/dev-server.ts.hbs` imports `app` and calls `serve()`.
- Integration tests use supertest + `@hono/node-server`'s `serve({ fetch: app.fetch, port: 0 })` for ephemeral port binding. Server is created in `beforeEach`, closed in `afterEach`.
- `hono`, `@hono/node-server`, `supertest`, `@types/supertest`, `@types/aws-lambda` are ALL devDependencies.
- Handler/repository pattern (Phase 6.5): ALL handlers import `userRepository` from `../db/user-repository.js` (an object, not a class). No `// @feature:database` conditionals remain in handlers.
- Base (in-memory) repository: `templates/services/users/src/db/user-repository.ts` — delegates to the same `users` Map from `store.ts`. Integration tests clear `users` in `beforeEach` and the repo writes through the same Map, so tests remain isolated.
- DynamoDB overlay: `templates/database/services/users/src/db/user-repository.ts.hbs` — uses AWS SDK v3 commands (`GetCommand`, `PutCommand`, `DeleteCommand`, `QueryCommand`). `.hbs` extension needed because content contains `@{{projectName}}/database-client` placeholder.
- Database users package.json overlay: `templates/database/services/users/package.json.hbs` — adds `@{{projectName}}/database-client` and `@aws-sdk/lib-dynamodb` to `dependencies`. This file overwrites the base `package.json.hbs` from the services template when the database feature is enabled.
- `exactOptionalPropertyTypes: true` in shared tsconfig means `{ region: string | undefined }` is a type error for `DynamoDBClientConfig`. Fix: `new DynamoDBClient(region ? { region } : {})`.
- `lambdaToHono` adapter MUST forward Hono path params to `event.pathParameters` — fixed in `templates/packages/lambda-utils/src/lambda-adapter.ts` via `c.req.param()`.
- Status codes: 201 create, 200 get/list/update, 204 delete, 404 not found, 400 bad request.
- UUID generation: `crypto.randomUUID()` (Node built-in, no uuid package needed).
- Service ports: health=3001, users=3002.

## auth/ template conventions
- Structure: `package.json.hbs`, `tsconfig.json.hbs`, `vitest.config.ts`, `src/authorizer.ts`, `src/__tests__/authorizer.test.ts`.
- Handler: TOKEN-type Lambda authorizer. Signature: `(event: APIGatewayTokenAuthorizerEvent) => Promise<APIGatewayAuthorizerResult>`.
- JWT validation: `aws-jwt-verify` v5.1.1 — `CognitoJwtVerifier.create()` at module scope for JWKS caching across warm invocations.
- Types imported from `aws-lambda` (the `@types/aws-lambda` package), not inline type definitions.
- Reads `USER_POOL_ID` and `CLIENT_ID` from env. Throws at module init if missing (caught by Lambda runtime → cold start failure = fast fail).
- Returns Deny policy (not `throw "Unauthorized"`) so API Gateway always receives a valid IAM response.
- Token extraction: `authorizationToken.split(" ")` — expects "Bearer <token>", returns null for anything else.
- Context forwarded on Allow: `sub`, `username`, `email` (if present) as `$context.authorizer.*`.
- Test file uses `vi.hoisted` + `vi.mock("aws-jwt-verify", ...)` + `vi.stubEnv(...)` + top-level `await import("../authorizer.js")` pattern.
- `aws-jwt-verify` is a production `dependency` (not devDependency) — shipped to Lambda.

## template-helpers conventions
- `getTemplateDirs(features)` — always returns `["base","infra","services","dev-gateway","packages"]` then
  appends conditionals in order: `frontend`, `auth`, `e2e`, `database`, `cicd`, `monitoring`, `extras`.
  The `hooks` flag maps to the `"extras"` directory (not `"hooks"`).
- `getVariableMap(config)` — returns `{ projectName, awsRegion }` at minimum; grows as templates are authored.
- `getWorkspaceEntries(features)` — always returns `["infra","services/*","dev-gateway","packages/*"]` then
  appends `frontend`, `auth`, `e2e` if enabled. `database`, `rds`, `cicd`, `monitoring`, `hooks` do NOT
  produce separate workspace entries.

## CDK stack conventions
- All service stacks extend `ServiceStack` from `templates/infra/src/stacks/base-stack.ts`.
- Props: `ServiceStackProps` (extends `cdk.StackProps` + `stage: string` + `config: StageConfig`).
- Resource naming: `this.resourceName("{{projectName}}-<service>")` → `"<name>-<stage>"`.
- Log groups: `/aws/lambda/{{projectName}}-<service>-${this.stage}` pattern.
- RemovalPolicy: `this.removalPolicy` (DESTROY for dev, RETAIN for prod).
- Tracing: `this.config.tracingEnabled ? Tracing.ACTIVE : Tracing.DISABLED`.
- Bundling: `externalModules: ["@aws-sdk/*"]`, minify only in prod, sourceMap only in non-prod.
- CfnOutput exportName pattern: `{{projectName}}-<OutputName>-${this.stage}`.
- Auth stack CDK entry path for Lambda: `../../../../auth/src/authorizer.ts` (relative to `__dirname` inside `infra/src/stacks/modules/`).

## module-prompts.ts patterns

### clack.multiselect generic typing
`clack.multiselect<T>` is generic; pass the union type explicitly so TypeScript
narrows the return from `T[] | symbol` correctly:
```typescript
const selected = await clack.multiselect<"list" | "get" | "create" | "update" | "delete">({
  ...
  required: true,
});
handleCancel(selected);
const selections = selected as Array<"list" | "get" | "create" | "update" | "delete">;
```
`required: true` on multiselect prevents the user submitting zero items.

### --protected flag flow in runModulePrompts
1. Auth check runs AFTER project context detection (step 3) — calls `detectAuthSupport(projectDir)`.
2. Endpoint selection (step 5) runs BEFORE the summary note (step 6) so the summary can
   include the protected endpoints line.
3. With `-y` all 5 endpoints set to `true` with no prompt.
4. Without `--protected`, `protectedEndpoints` stays `undefined` in the returned config —
   no auth resources generated (matches `ModuleConfig.protectedEndpoints?` being optional).
5. Summary line: `Protected    : list, get, create, update, delete` (or subset, or "(none)").
