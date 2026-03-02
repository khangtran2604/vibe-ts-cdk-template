# `vibe-ts-cdk-template` — Implementation Plan

## Context

A CLI scaffolding tool that generates a full-stack AWS TypeScript monorepo for developers who want to build web applications on AWS without worrying about project setup. Similar to `create-t3-app` but targeting AWS (CDK + Lambda + API Gateway + Amplify).

**Target users**: Developers / Software engineers building fullstack web apps on AWS.

---

## Decisions Summary

| Area | Decision |
|------|----------|
| CLI name | `vibe-ts-cdk-template` |
| CLI framework | `@clack/prompts` + `commander` |
| CLI invocation | Direct: `vibe-ts-cdk-template` (no subcommands) |
| Templating | Template directory with `{{variable}}` substitution + `// @feature:X` conditionals |
| Presets | 3 tiers: minimal, standard, full |
| Monorepo | pnpm workspaces + Turborepo |
| CDK pattern | Stack-per-service, API Gateway per service, stage-based config (`-c stage=dev`) |
| Backend | Microservices workspaces (`services/*`), Lambda-first handlers |
| Frontend | Vite + React, feature-based folder structure |
| Auth | CDK Cognito UserPool + custom Lambda authorizer |
| Database | DynamoDB (default) + optional RDS Aurora Serverless |
| Local dev | Hono dev server per service + dev-gateway proxy + Turborepo parallel |
| Testing | Vitest (unit), supertest via Hono (integration), Playwright (e2e) |
| Test layout | Co-located `__tests__/` folders; e2e in separate workspace |

---

## Presets

| Feature | Minimal | Standard | Full |
|---------|---------|----------|------|
| Infra (CDK) | Y | Y | Y |
| Backend services | Y | Y | Y |
| Shared packages | Y | Y | Y |
| Dev gateway | Y | Y | Y |
| Frontend (Vite + React) | | Y | Y |
| Auth (Cognito + Authorizer) | | Y | Y |
| E2E tests (Playwright) | | Y | Y |
| Database (DynamoDB + optional RDS) | | | Y |
| CI/CD (GitHub Actions) | | | Y |
| Monitoring (CloudWatch) | | | Y |
| Pre-commit hooks (Husky + lint-staged) | | | Y |

---

## Generated Project Structure (Full Preset)

```
my-app/
├── .github/workflows/                  # CI/CD (full)
│   ├── ci.yml
│   ├── deploy-staging.yml
│   └── deploy-production.yml
├── .husky/pre-commit                   # Pre-commit (full)
│
├── infra/                              # CDK — stack-per-service
│   ├── package.json
│   ├── cdk.json
│   └── src/
│       ├── index.ts                    # CDK app entry, reads -c stage=dev
│       ├── config.ts                   # { dev: {...}, staging: {...}, prod: {...} }
│       └── stacks/
│           ├── modules/
│           │   ├── health-stack.ts     # Health: own API GW + Lambda
│           │   └── users-stack.ts      # Users: own API GW + CRUD Lambdas
│           ├── frontend-stack.ts       # Amplify hosting (standard+)
│           ├── auth-stack.ts           # Cognito + Authorizer (standard+)
│           ├── database-stack.ts       # DynamoDB + optional RDS (full)
│           └── monitoring-stack.ts     # CloudWatch (full)
│
├── services/                           # Microservices (each is a pnpm workspace)
│   ├── health/                         # Health check service
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── src/
│   │       ├── handlers/health.ts      # Raw Lambda handler
│   │       ├── dev-server.ts           # Hono dev server (port 3001)
│   │       └── __tests__/health.test.ts
│   └── users/                          # Users CRUD service
│       ├── package.json
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       └── src/
│           ├── handlers/
│           │   ├── create-user.ts
│           │   ├── get-user.ts
│           │   ├── list-users.ts
│           │   ├── update-user.ts
│           │   └── delete-user.ts
│           ├── types/index.ts
│           ├── dev-server.ts           # Hono dev server (port 3002)
│           ├── __tests__/
│           │   └── create-user.test.ts
│           └── test/
│               └── integration/api.test.ts   # Supertest via Hono
│
├── dev-gateway/                        # Local dev gateway (routes to all services)
│   ├── package.json
│   └── src/gateway.ts                  # Proxies /health→:3001, /users→:3002
│
├── frontend/                           # Vite + React, feature-based (standard+)
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── .env.development                # VITE_API_URL=http://localhost:3000
│   ├── .env.production
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                      # Router setup
│       ├── features/
│       │   └── home/
│       │       ├── HomePage.tsx
│       │       ├── components/
│       │       └── hooks/
│       ├── shared/
│       │   ├── components/
│       │   ├── hooks/
│       │   └── lib/api.ts              # Env-based API client
│       └── assets/logo.svg
│
├── auth/                               # Cognito Lambda authorizer (standard+)
│   ├── package.json
│   └── src/
│       ├── authorizer.ts
│       └── __tests__/authorizer.test.ts
│
├── e2e/                                # Playwright (standard+)
│   ├── package.json
│   ├── playwright.config.ts
│   └── tests/
│       ├── home.spec.ts
│       └── fixtures/
│
├── packages/
│   ├── lambda-utils/                   # Shared Lambda adapter + middleware
│   │   ├── package.json
│   │   └── src/
│   │       ├── lambda-adapter.ts       # Hono req ↔ Lambda event converter
│   │       ├── middleware/error-handler.ts
│   │       └── types/api-types.ts
│   ├── shared-types/                   # Shared TypeScript types
│   ├── utils/                          # Shared utility functions
│   ├── eslint-config/                  # Shared ESLint configuration
│   └── tsconfig/                       # Shared TS configs (base, node, react)
│
├── turbo.json
├── pnpm-workspace.yaml
├── lint-staged.config.js               # (full)
└── package.json                        # "dev": "turbo run dev"
```

---

## CLI Project Structure (the tool itself)

```
vibe-ts-cdk-template/                   # This repo
├── package.json                        # bin: "vibe-ts-cdk-template" → dist/index.js
├── tsconfig.json
├── tsup.config.ts                      # ESM, node24, shebang banner
│
├── src/                                # CLI source code
│   ├── index.ts                        # Entry: commander args + clack prompts + scaffold
│   ├── prompts.ts                      # All clack interactive prompts
│   ├── scaffolder.ts                   # Core: copy templates, apply transforms, git, pnpm
│   ├── template-helpers.ts             # Feature flags → template dirs, variable maps, conditionals
│   ├── presets.ts                      # Preset → FeatureFlags mapping
│   ├── types.ts                        # ProjectConfig, Preset, FeatureFlags interfaces
│   ├── constants.ts                    # CLI name, version
│   └── utils/
│       ├── fs.ts                       # copyDir, rename _files, strip .hbs, {{var}} replace
│       ├── git.ts                      # git init helper
│       ├── pnpm.ts                     # pnpm install runner
│       └── logger.ts                   # Thin wrapper around clack.log
│
├── templates/                          # Template files copied into generated projects
│   ├── base/                           # Root configs (all presets)
│   ├── infra/                          # CDK stacks
│   ├── services/                       # Microservice workspaces (health, users)
│   ├── dev-gateway/                    # Local dev gateway
│   ├── packages/                       # Shared packages (lambda-utils, types, utils, eslint, tsconfig)
│   ├── frontend/                       # Vite + React (standard+)
│   ├── auth/                           # Cognito authorizer (standard+)
│   ├── e2e/                            # Playwright (standard+)
│   ├── database/                       # DynamoDB + RDS (full)
│   ├── cicd/                           # GitHub Actions (full)
│   ├── monitoring/                     # CloudWatch (full)
│   └── extras/                         # Husky + lint-staged (full)
│
└── test/                               # CLI tests
    ├── scaffolder.test.ts
    ├── presets.test.ts
    └── template-helpers.test.ts
```

---

## CLI Interactive Flow

```
$ vibe-ts-cdk-template

  ╭──────────────────────────────────────╮
  │  vibe-ts-cdk-template v0.1.0        │
  │  Scaffold a full-stack AWS monorepo  │
  ╰──────────────────────────────────────╯

  ◆ What is your project name?
  │  my-aws-app

  ◆ Which preset would you like?
  │  ○ minimal   — CDK + Services (Lambda + API Gateway)
  │  ● standard  — + Frontend (Vite React) + Auth (Cognito)
  │  ○ full      — + Database, CI/CD, Monitoring, Pre-commit hooks

  ◆ What is your AWS region?
  │  ap-southeast-1

  ◇ [If full] Include RDS Aurora Serverless alongside DynamoDB?
  │  ○ Yes  ● No

  ◆ Initialize a git repository?
  │  ● Yes  ○ No

  ◆ Install dependencies with pnpm?
  │  ● Yes  ○ No

  ◇ Scaffolding project...
  ● base configuration ✓
  ● infrastructure (CDK) ✓
  ● services (health, users) ✓
  ● dev gateway ✓
  ● shared packages ✓
  ● frontend (Vite + React) ✓          [standard/full]
  ● auth (Cognito + Authorizer) ✓      [standard/full]
  ● e2e tests (Playwright) ✓           [standard/full]
  ● database ✓                          [full]
  ● CI/CD (GitHub Actions) ✓            [full]
  ● monitoring ✓                        [full]
  ● pre-commit hooks ✓                  [full]

  ◆ Done! Next steps:
  │  cd my-aws-app
  │  pnpm dev                # Start all dev servers
  │  pnpm cdk deploy --all   # Deploy to AWS
```

**Non-interactive flags**: `--preset <minimal|standard|full>`, `--region <aws-region>`, `--rds`, `--no-git`, `--no-install`, `-y`

---

## Local Development Strategy

### Lambda-first handlers + Hono dev server per service

```typescript
// services/users/src/handlers/create-user.ts — PRIMARY (deployed to Lambda)
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const body = JSON.parse(event.body || "{}");
  return { statusCode: 201, body: JSON.stringify({ id: "1", ...body }) };
};

// services/users/src/dev-server.ts — LOCAL DEV (Hono wrapping handlers)
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { lambdaToHono } from "@my-app/lambda-utils";
import { handler as createUser } from "./handlers/create-user";

const app = new Hono();
app.post("/users", lambdaToHono(createUser));
serve({ fetch: app.fetch, port: 3002 });
```

### Dev Gateway — single entry point

```typescript
// dev-gateway/src/gateway.ts — proxies to all service dev servers
// /health/* → http://localhost:3001
// /users/*  → http://localhost:3002
```

### `pnpm dev` starts everything

```
root package.json     → "dev": "turbo run dev"
services/health       → "dev": "tsx watch src/dev-server.ts"    (port 3001)
services/users        → "dev": "tsx watch src/dev-server.ts"    (port 3002)
dev-gateway           → "dev": "tsx watch src/gateway.ts"       (port 3000)
frontend              → "dev": "vite"                           (port 5173)
```

Frontend `.env.development` → `VITE_API_URL=http://localhost:3000` (gateway)

Turborepo `dev` task is `persistent: true` — all servers run in parallel.

`hono` and `@hono/node-server` are devDependencies only (not shipped to Lambda).

---

## Testing Strategy (in generated project)

| Layer | Tool | Location | What it tests |
|-------|------|----------|---------------|
| Service unit | Vitest | `services/*/src/__tests__/*.test.ts` | Lambda handlers with mock events |
| Service integration | Vitest + supertest | `services/*/test/integration/*.test.ts` | Full request cycle via Hono dev server |
| Frontend unit | Vitest | `frontend/src/**/__tests__/*.test.tsx` | React components |
| Auth unit | Vitest | `auth/src/__tests__/*.test.ts` | Lambda authorizer |
| E2E | Playwright | `e2e/tests/*.spec.ts` | Full app in browser |

- Unit tests are **co-located** in `__tests__/` folders next to source
- Integration tests use supertest hitting the Hono app (same as dev-server)
- E2E is a **separate root-level workspace** with own `playwright.config.ts`
- Each workspace has its own `vitest.config.ts`; `turbo run test` runs all
- Template includes `packages/lambda-utils/src/test-utils/mock-event.ts` for creating mock `APIGatewayProxyEvent`

---

## CDK Architecture

### Stack-per-service with isolated API Gateways

Each backend service gets its own CDK stack with its own API Gateway. This ensures:
- **Independent deployment**: `cdk deploy UsersStack -c stage=dev` deploys only users
- **CloudFormation 500-resource limit**: Each stack stays small as the codebase grows
- **No cross-service deployment impact**: Deploying one service never affects others
- **Deployment time scales**: Adding services doesn't slow down existing deployments

### Stage-based configuration

```typescript
// infra/src/config.ts
export const config = {
  dev:     { account: "111111111111", region: "ap-southeast-1", domainName: "dev.myapp.com" },
  staging: { account: "222222222222", region: "ap-southeast-1", domainName: "staging.myapp.com" },
  prod:    { account: "333333333333", region: "ap-southeast-1", domainName: "myapp.com" },
};

// Usage: cdk deploy --all -c stage=dev
```

### Conditional stacks via `// @feature:X` pattern

```typescript
// infra/src/index.ts.hbs — templates stay valid TypeScript
import { HealthStack } from "./stacks/modules/health-stack";
import { UsersStack } from "./stacks/modules/users-stack";
// @feature:frontend import { FrontendStack } from "./stacks/frontend-stack";
// @feature:auth import { AuthStack } from "./stacks/auth-stack";
// @feature:database import { DatabaseStack } from "./stacks/database-stack";
// @feature:monitoring import { MonitoringStack } from "./stacks/monitoring-stack";
```

Scaffolder uncomments lines if the feature is enabled, removes the line if not.

---

## Template Conventions

| Convention | Example | Purpose |
|------------|---------|---------|
| `_` prefix for dot files | `_gitignore` → `.gitignore` | Prevents tooling from treating templates as hidden/config files |
| `.hbs` suffix | `package.json.hbs` → `package.json` | Indicates file has `{{variable}}` placeholders |
| `{{variable}}` | `{{projectName}}`, `{{awsRegion}}` | Simple string replacement, no template engine |
| `// @feature:X` | `// @feature:frontend import {...}` | Conditional line inclusion based on preset features |

---

## Implementation Phases

### Phase 1: Bootstrap CLI Project
**Goal**: `vibe-ts-cdk-template --help` works.

Files: `.gitignore`, `.npmrc`, `package.json`, `tsconfig.json`, `tsup.config.ts`, `src/index.ts`, `src/constants.ts`, `src/types.ts`

**Verify**: `pnpm install && pnpm build && pnpm link --global && vibe-ts-cdk-template --help`

### Phase 2: Interactive Prompts
**Goal**: Full prompt flow produces a `ProjectConfig` object.

Files: `src/prompts.ts`, `src/presets.ts`

**Verify**: Run CLI, answer prompts, see config logged to console.

### Phase 3: Scaffolding Engine + Base Templates
**Goal**: Copy `templates/base/` with variable substitution.

Files: `src/scaffolder.ts`, `src/template-helpers.ts`, `src/utils/fs.ts`, `src/utils/git.ts`, `src/utils/pnpm.ts`, `src/utils/logger.ts`, `templates/base/*`

**Verify**: Run CLI → minimal preset → output has correct root files with project name.

### Phase 4: Minimal Preset Templates
**Goal**: Full minimal preset works end-to-end.

Files: `templates/infra/*`, `templates/services/health/*`, `templates/services/users/*`, `templates/dev-gateway/*`, `templates/packages/*`

**Verify**: `vibe-ts-cdk-template` → minimal → `cd output && pnpm install && pnpm dev && pnpm test`

### Phase 5: Standard Preset Templates
**Goal**: Adds frontend + auth + e2e.

Files: `templates/frontend/*`, `templates/auth/*`, `templates/e2e/*`, `templates/infra/src/stacks/frontend-stack.ts.hbs`, `templates/infra/src/stacks/auth-stack.ts.hbs`

**Verify**: Standard preset generates frontend, auth, e2e dirs; infra imports correct stacks.

### Phase 6: Full Preset Templates
**Goal**: Adds database, CI/CD, monitoring, pre-commit hooks.

Files: `templates/database/*`, `templates/cicd/*`, `templates/monitoring/*`, `templates/extras/*`, `templates/infra/src/stacks/database-stack.ts.hbs`, `templates/infra/src/stacks/monitoring-stack.ts.hbs`

**Verify**: `vibe-ts-cdk-template --preset full --rds -y` generates all directories and files.

### Phase 7: Testing & Polish
**Goal**: CLI is production-quality.

Files: `test/scaffolder.test.ts`, `test/presets.test.ts`, `test/template-helpers.test.ts`, `README.md`

**Verify**: `pnpm test` passes; end-to-end: generate all 3 presets, verify each builds and tests pass.

---

## Key Implementation Details

- **Template resolution at runtime**: `path.resolve(__dirname, "..", "templates")` — `dist/index.js` is one level below package root
- **`package.json` `"files"` field**: `["dist", "templates"]` — ensures templates ship with the package
- **`pnpm-workspace.yaml`**: Built programmatically in scaffolder (not template) since workspace entries vary by preset
- **Service port assignment**: Health=3001, Users=3002, etc. — auto-assigned based on service index
- **No template engine dependency**: Simple `String.replaceAll("{{key}}", value)` for variables

---

## Verification (End-to-End)

```bash
# Build and link CLI
pnpm install && pnpm build && pnpm link --global

# Test each preset
vibe-ts-cdk-template                           # interactive → minimal
vibe-ts-cdk-template --preset standard -y      # non-interactive
vibe-ts-cdk-template --preset full --rds -y    # full with RDS

# Verify generated project
cd <generated-project>
pnpm install
pnpm dev          # All dev servers start
pnpm test         # All tests pass
pnpm build        # All packages build
pnpm cdk diff     # CDK synthesizes correctly
```
