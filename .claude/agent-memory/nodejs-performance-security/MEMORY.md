# Node.js Performance & Security Memory

## Project Snapshot (as of 2026-03-02)

- **Runtime target**: Node 24.x, ESM-only (`"type": "module"` in package.json)
- **Build tool**: tsup v8.5.1 — bundles `src/index.ts` as the single entry; other
  source files only appear in the bundle once imported from `index.ts`.
- **Type checking**: `@types/node` is NOT installed. `tsc --noEmit` reports
  `Cannot find name 'process'` errors in pre-existing files. tsup builds fine
  because it does not use tsc for node globals. Do not treat these tsc errors as
  regressions introduced by new code — they are pre-existing.
- **Tests**: vitest v4.0.18. Run with `pnpm test`. All test files are in `test/`.

## Established Patterns

### @clack/prompts usage
- Import as `import * as clack from "@clack/prompts"` (namespace import keeps
  the call sites readable: `clack.intro()`, `clack.text()`, etc.).
- `clack.isCancel(value)` checks for the cancellation symbol returned when the
  user hits Ctrl+C. Must be called after every awaited prompt.
- `text()`, `select()`, `confirm()` all return `Promise<T | symbol>` — cast to
  the concrete type after `isCancel` is confirmed false.
- `select<Value>()` is generic; pass the union type explicitly so TypeScript
  narrows the result correctly.

### Cancellation pattern
```typescript
function handleCancel(value: unknown): void {
  if (clack.isCancel(value)) {
    clack.outro("Cancelled. No files were written.");
    process.exit(0);
  }
}
```
Call `handleCancel(result)` immediately after every `await clack.*()` call.

### CLI flags vs. prompts
- Commander injects its own defaults (e.g. `region` defaults to `"us-east-1"`)
  even when the user never typed the flag.  Do not use `!== undefined` to detect
  "user explicitly set this" for options with defaults — compare against the
  known default value instead, or use a separate boolean sentinel.
- `--no-git` / `--no-install` → commander exposes these as `git: boolean` and
  `install: boolean` in `opts()`.  `undefined` means the flag was not declared;
  `true`/`false` means it was (possibly defaulted).

### Feature-flag resolution
- `getFeatureFlags(preset, options?)` in `src/presets.ts` is the single source of
  truth. `src/prompts.ts` imports and uses it directly — no inline duplicate.
- `rds` is guarded behind `database`: `rds: base.database && (options?.rds ?? base.rds)`.
  Callers cannot produce `{ rds: true, database: false }`.

### isMain guard (ESM + symlinks)
- Use `realpathSync` to compare the current file against `process.argv[1]`.
  The old `endsWith` approach breaks with npx/npm link symlinks.
```typescript
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";
const isMain = (() => {
  try {
    return fileURLToPath(import.meta.url) === realpathSync(process.argv[1] ?? "");
  } catch { return false; }
})();
```

### Async action handler + parseAsync
- Commander action handlers are `async`; use `.parseAsync().catch(...)` at the
  entry point. `.parse()` is synchronous and turns unhandled rejections into
  silent crashes.

### Input validation pattern (CLI flags)
- Always pre-validate values supplied via flags using the same validator function
  used in the clack `validate:` callback.  If invalid: warn via `clack.log.warn`,
  then fall back to an interactive prompt so the user can correct it.

### Vitest mocking with vi.hoisted()
- `vi.mock()` factories are hoisted before any `const` declarations.  Variables
  used inside a factory MUST be defined via `vi.hoisted()`, not as top-level
  `const`s — otherwise you hit "Cannot access 'X' before initialization" (TDZ).
- Pattern: `const { spy, data } = vi.hoisted(() => ({ spy: vi.fn(), data: ... }));`
  then reference `spy` / `data` directly inside `vi.mock("...", () => ...)`.
- After `vi.clearAllMocks()` in `beforeEach`, re-apply `.mockResolvedValue()` on
  any async mock spies since `clearAllMocks` wipes their implementations.
- `clack.spinner` mock must be included in `mockClack` and re-applied in
  `beforeEach`: `mockClack.spinner.mockReturnValue({ start: vi.fn(), stop: vi.fn() })`.

### Mocking process.exit() in tests
- `vi.spyOn(process, "exit").mockImplementation(() => undefined as never)` does
  NOT halt execution — the action handler continues past the `catch` block.
- To properly simulate `process.exit`, make the mock throw a sentinel error:
  ```typescript
  class ExitError extends Error { constructor(public code: number) { super(); } }
  const exitSpy = vi.spyOn(process, "exit").mockImplementation((code) => {
    throw new ExitError(typeof code === "number" ? code : 1);
  });
  ```
  Then wrap `await parse(...)` in try/catch and inspect `caughtErr.code`.

### Module import convention
- Local imports use `.js` extension even for `.ts` source files
  (NodeNext module resolution requires this).

### Utility module conventions (src/utils/)
- `logger.ts` — thin wrapper over `clack.log.*`; exported as named functions
  `info`, `success`, `warn`, `error`. Does NOT re-export clack directly.
- `git.ts` — `initGit(dir): Promise<GitResult>`. Uses async `exec` (promisified)
  with timeouts: 5_000ms for availability check (`git --version`), 15_000ms for
  `git init`. Returns `{ success, error? }`. stdout/stderr are captured (not piped
  to terminal).
- `pnpm.ts` — `installDeps(dir): Promise<PnpmResult>`. Uses async `exec`
  (promisified) with timeouts: 5_000ms for availability check, 120_000ms for
  `pnpm install`. Wraps the command in a `clack.spinner()`. `err.stderr` from
  async exec is a `string` (not a Buffer — unlike execSync's ExecSyncError).
  Omits `--frozen-lockfile` because generated projects have no lockfile yet.
- CRITICAL: Both git/pnpm helpers use async exec (NOT execSync) to avoid blocking
  the event loop during clack spinner animation. execSync freezes the spinner.
- Both git/pnpm helpers emit user-facing feedback via the logger internally;
  callers do not need to add extra messaging around successful/failed calls.

### scaffolder.ts conventions
- `scaffold(config)` is the single public export. It does NOT catch errors —
  propagates to `index.ts` outer catch.
- Template root: `import.meta.dirname ?? dirname(fileURLToPath(import.meta.url))`
  then `join(dir, "..", "templates")`. `import.meta.dirname` is Node 21+, safe on Node 24.
- `SUBDIR_TEMPLATE_DIRS = new Set(["services","infra","dev-gateway","packages","frontend","auth","e2e"])`.
  These land in a same-named subdir of the project. Others (base, database, cicd,
  monitoring, extras) are merged into the project root.
  frontend/auth/e2e were added in Phase 5 — they are workspace members that need
  their own subdirectory, not merged into root.
- `SUBDIR_TEMPLATE_DIRS` is a module-level constant (not inside `scaffold()`).
- `pnpm-workspace.yaml` is generated via `buildWorkspaceYaml(getWorkspaceEntries(features))`
  — never from a template file.
- Uses sequential `for...of` (not `Promise.all`) for template directory copies so
  later dirs can override files from earlier dirs in a deterministic order.
- Directory existence guard uses `fs/promises.access` wrapped in try/catch
  (`pathExists` helper) — no stat calls needed.

## Key File Paths

| File | Purpose |
|------|---------|
| `src/index.ts` | Commander setup + action handler (Phase 3 wired — calls scaffold()) |
| `src/scaffolder.ts` | `scaffold(config)` — main orchestration: copyDir → workspace yaml → git → pnpm |
| `src/prompts.ts` | @clack interactive prompt flow; exports `runPrompts`, `CliFlags` |
| `src/presets.ts` | `getFeatureFlags(preset, options?)`, `PRESET_DESCRIPTIONS` |
| `src/types.ts` | `ProjectConfig`, `Preset`, `FeatureFlags` types |
| `src/constants.ts` | `CLI_NAME`, `CLI_VERSION`, `DEFAULT_REGION` |
| `src/utils/logger.ts` | clack.log wrapper: `info`, `success`, `warn`, `error` |
| `src/utils/git.ts` | `initGit(dir)` — async exec git init with timeouts, returns `GitResult` |
| `src/utils/pnpm.ts` | `installDeps(dir)` — async exec pnpm install with spinner + timeouts, returns `PnpmResult` |
| `src/utils/fs.ts` | Template transforms: `copyDir`, `renameFile`, `replaceVariables`, `processConditionals` — CONDITIONAL_RE handles both top-level and indented `// @feature:X` lines (group 1=indent, group 2=name, group 3=code). `renameFile` is applied to BOTH files AND directories in copyDir (fixed in Phase 6.2 to support `_github/` → `.github/`). |
| `src/template-helpers.ts` | `getTemplateDirs`, `getVariableMap`, `getWorkspaceEntries` |
| `test/index.test.ts` | Commander parsing + action handler tests (44 tests) |
| `test/utils/fs.test.ts` | Filesystem utils tests (52 tests, includes tmp-dir integration) |
| `test/template-helpers.test.ts` | template-helpers unit tests (55 tests) |
| `tsup.config.ts` | Build config (entry: `src/index.ts`, target: node24) |

### Template conventions (packages/, services/, auth/, CDK stacks, template-helpers)
See `templates.md` for full details. Key rules:
- `tsconfig.json` with `{{projectName}}` placeholder MUST use `.hbs` extension.
- Every package extending `@{{projectName}}/tsconfig/node.json` needs `"@{{projectName}}/tsconfig": "workspace:*"` devDep.
- Node.js globals require `"@types/node": "22.x"` devDep — affects: utils, lambda-utils, health, users, dev-gateway, auth.
- Service vitest configs: `exclude: ["dist/**", "**/node_modules/**"]`.
- CDK stacks: extend `ServiceStack`, use `this.resourceName()`, `this.removalPolicy`, `this.logRetention()`.
- Auth lambda authorizer: `aws-jwt-verify` (production dep), types from `aws-lambda`, returns Deny on all failures.
- Auth stack CDK entry path: `../../../../auth/src/authorizer.ts` relative to `__dirname` inside infra/src/stacks/modules/.
- `getWorkspaceEntries`: `frontend`, `auth`, `e2e` get workspace entries when enabled. Other features do not.

### Database template conventions (Phase 6.1)
- Located at `templates/database/packages/database-client/` — merges into project root
  as `packages/database-client/` (database NOT in SUBDIR_TEMPLATE_DIRS).
- `packages/database-client` needs NO extra workspace entry — already covered by `"packages/*"` glob.
- CDK database stack: `templates/infra/src/stacks/modules/database-stack.ts.hbs`.
- DynamoDB table: `PAY_PER_REQUEST`, pk (HASH) + sk (RANGE) strings, GSI EmailIndex on gsi1pk/gsi1sk.
- `pointInTimeRecovery: !this.config.isDev` — enables PITR in staging/prod automatically.
- RDS resources gated behind `// @feature:rds` — VPC (isolated subnets, no NAT), SecurityGroup,
  Aurora PostgreSQL v16.4 Serverless v2 cluster (0.5–4 ACU, credentials via Secrets Manager).
- DatabaseStack exports: `usersTable`, `usersTableName`, `usersTableArn` for service stacks.
- database-client package: `getDocumentClient()` singleton (lazy-init, module scope for Lambda reuse),
  `getUsersTableName()` reads USERS_TABLE_NAME env var (throws at startup if missing).
- `_resetClientForTesting()` exported for test isolation (resets singleton).

### CI/CD template conventions (Phase 6.2)
- Located at `templates/cicd/_github/workflows/` — merges into project root as `.github/workflows/`.
- No `.hbs` extension needed (no `{{variable}}` placeholders). GitHub Actions `${{ }}` syntax is distinct.
- Three workflows: `ci.yml` (PR), `deploy-staging.yml` (push to main), `deploy-production.yml` (workflow_dispatch).
- AWS credentials via OIDC: `aws-actions/configure-aws-credentials@v4` with `role-to-assume: ${{ secrets.AWS_ROLE_ARN }}`.
- pnpm caching: `pnpm/action-setup@v4` + `actions/setup-node@v4` with `cache: "pnpm"`.
- CDK deploy uses `pnpm --filter infra exec -- npx cdk deploy --all -c stage=<env> --require-approval never`.
- `id-token: write` permission required in deploy workflows for OIDC token generation.

### Extras template conventions (Phase 6.4 — Husky + lint-staged)
- Located at `templates/extras/` — NOT in SUBDIR_TEMPLATE_DIRS, so contents merge into project root.
- `templates/extras/_husky/pre-commit` → generated project's `.husky/pre-commit`.
  Directory rename `_husky` → `.husky` handled by `renameFile()` applied to directories in `copyDir`.
- No `.hbs` extension needed — no `{{variable}}` placeholders in these files.
- Husky v9 style: simple shell scripts in `.husky/`, no shebang needed.
- `copyDir` directory rename fix: previously used `entry.name` raw for subdirs; now uses `renameFile(entry.name)`.
  This is a correctness fix that affects any template dir with a `_`-prefixed subdirectory name.

### Monitoring / database / repository details
See `templates.md` for full conventions on each template layer.

Key Phase 6.5 fix: handler/repository pattern. All handlers now use `userRepository` object
from `../db/user-repository.js`. Base = in-memory Map. Database overlay = DynamoDB via AWS SDK v3
commands. See `templates.md` "services/ template conventions" for full details.

CRITICAL: `exactOptionalPropertyTypes: true` in shared tsconfig — `{ region: string | undefined }`
is a type error. Use `new DynamoDBClient(region ? { region } : {})` pattern.
