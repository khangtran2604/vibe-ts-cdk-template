# Phase 6 Summary: Full Preset Templates

## Completed On
2026-03-03

## What Was Built

- `templates/database/packages/database-client/` — Shared DynamoDB client package with typed interfaces (DynamoItem, UserItem, CreateUserInput), lazy-init DocumentClient singleton, getUsersTableName helper
- `templates/database/services/users/src/db/user-repository.ts.hbs` — DynamoDB-backed user repository with in-memory fallback (auto-selects based on USERS_TABLE_NAME env var)
- `templates/database/services/users/package.json.hbs` — Users service package.json overlay adding database-client dependency
- `templates/infra/src/stacks/modules/database-stack.ts.hbs` — CDK DynamoDB table (pk/sk, EmailIndex GSI) + optional Aurora Serverless v2 via `// @feature:rds`
- `templates/cicd/_github/workflows/ci.yml` — CI workflow: pnpm + turbo lint/build/test on PRs
- `templates/cicd/_github/workflows/deploy-staging.yml` — Deploy to staging on push to main via OIDC
- `templates/cicd/_github/workflows/deploy-production.yml` — Manual deploy to prod with `--require-approval broadening`
- `templates/monitoring/packages/monitoring/` — Structured JSON logger with level filtering, correlation IDs
- `templates/infra/src/stacks/modules/monitoring-stack.ts.hbs` — CloudWatch dashboard, stage-aware alarms (Lambda errors/duration, API 5xx), SNS topic, composite alarm
- `templates/extras/_husky/pre-commit` — Husky v9 hook running lint-staged (executable)
- `templates/extras/lint-staged.config.js` — ESLint on .ts/.tsx, Prettier on all supported files
- `src/utils/fs.ts` — Fixed directory rename (`_github` → `.github`) and executable permission mirroring
- `templates/services/users/src/db/user-repository.ts` — Base in-memory repository (all presets)
- `test/phase6-templates.test.ts` — 119 tests covering all Phase 6 template files

## Key APIs (for downstream tasks)

- `DatabaseStack` — exports `usersTable` (DynamoDB Table), CfnOutputs: UsersTableName, UsersTableArn, plus RDS outputs when enabled
- `MonitoringStack` — exports `alarmTopicArn`, CfnOutputs: DashboardUrl, AlarmTopicArn
- `createLogger(serviceName, baseContext?)` — returns `{ info, warn, error, debug }` structured JSON logger
- `userRepository` — unified async interface: findById, create, update, delete, exists, list (in-memory or DynamoDB)
- `getDocumentClient()` — lazy singleton DynamoDB DocumentClient
- `getUsersTableName()` — reads USERS_TABLE_NAME env var

## Patterns Established

- Repository pattern with template overlay: base provides in-memory impl, database template overlays with DynamoDB + in-memory fallback
- Dual-mode repository: auto-selects backend based on `USERS_TABLE_NAME` env var presence (tests use in-memory, Lambda uses DynamoDB)
- Package.json overlay: database template provides users service package.json.hbs that adds database deps
- GitHub Actions OIDC: `id-token: write` permission + `aws-actions/configure-aws-credentials` with `role-to-assume`
- Production deploys use `--require-approval broadening` (not `never`)
- Monitoring alert email via CDK context (`-c alertEmail=...`) rather than hardcoded placeholder
- CloudWatch composite alarm aggregates per-service alarms to reduce notification noise

## Decisions Made

- DynamoDB single-table design: `pk=USER#id`, `sk=USER#id`, GSI `gsi1pk=USERS`/`gsi1sk=createdAt`
- Aurora Serverless v2 PostgreSQL 16.4 for RDS option (0.5–4 ACU, auto-pause via deletion protection off in dev)
- `require` (not `import`) for lazy-loading SDK modules in DynamoDB repository to keep test startup fast
- copyDir now applies `renameFile` to directory names (not just files) and mirrors executable permissions

## Dependencies Added

- `@aws-sdk/client-dynamodb@^3.700.0` — DynamoDB client (database-client package)
- `@aws-sdk/lib-dynamodb@^3.700.0` — DocumentClient convenience layer
- `aws-jwt-verify` — (already from Phase 5, unchanged)

## Known Limitations

- E2E tests require `pnpm exec playwright install` before first run (browser binaries not bundled)
- DynamoDB `list` total count is per-page approximation (DynamoDB doesn't support efficient total counts)
- RDS `ServerlessCluster` uses L1/L2 constructs; auto-pause behavior depends on AWS region availability
- `__tests__` directory renamed to `._tests__` by the `_` prefix convention — functional but visually odd
