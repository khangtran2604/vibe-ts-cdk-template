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
- `SUBDIR_TEMPLATE_DIRS = new Set(["services", "infra", "dev-gateway", "packages"])`.
  These land in a same-named subdir of the project. Others (base, frontend, auth,
  e2e, database, cicd, monitoring, extras) are merged into the project root.
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
| `src/utils/fs.ts` | Template transforms: `copyDir`, `renameFile`, `replaceVariables`, `processConditionals` — CONDITIONAL_RE handles both top-level and indented `// @feature:X` lines (group 1=indent, group 2=name, group 3=code) |
| `src/template-helpers.ts` | `getTemplateDirs`, `getVariableMap`, `getWorkspaceEntries` |
| `test/index.test.ts` | Commander parsing + action handler tests (44 tests) |
| `test/utils/fs.test.ts` | Filesystem utils tests (44 tests, includes tmp-dir integration) |
| `test/template-helpers.test.ts` | template-helpers unit tests (55 tests) |
| `tsup.config.ts` | Build config (entry: `src/index.ts`, target: node24) |

### packages/ template conventions
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
  dev-gateway. The infra package already includes it.
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

### services/ template conventions
- Each service has: `package.json.hbs`, `tsconfig.json.hbs`, `vitest.config.ts`, `src/handlers/`, `src/__tests__/`, `test/integration/`.
- Handler signature: `(event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>`. Zero framework deps.
- In-memory store: module-level `Map` exported from `src/store.ts` — shared across all handlers in the same process.
- Dev server pattern: `src/app.ts.hbs` exports the Hono app (shared between dev-server and integration tests); `src/dev-server.ts.hbs` imports `app` and calls `serve()`.
- Integration tests use supertest + `@hono/node-server`'s `serve({ fetch: app.fetch, port: 0 })` for ephemeral port binding. Server is created in `beforeEach`, closed in `afterEach`.
- `hono`, `@hono/node-server`, `supertest`, `@types/supertest`, `@types/aws-lambda` are ALL devDependencies.
- `// @feature:database` annotations mark lines to swap in-memory store for a real repository in Phase 6.
- `lambdaToHono` adapter MUST forward Hono path params to `event.pathParameters` — fixed in `templates/packages/lambda-utils/src/lambda-adapter.ts` via `c.req.param()`.
- Status codes: 201 create, 200 get/list/update, 204 delete, 404 not found, 400 bad request.
- UUID generation: `crypto.randomUUID()` (Node built-in, no uuid package needed).
- Service ports: health=3001, users=3002.

### template-helpers conventions
- `getTemplateDirs(features)` — always returns `["base","infra","services","dev-gateway","packages"]` then
  appends conditionals in order: `frontend`, `auth`, `e2e`, `database`, `cicd`, `monitoring`, `extras`.
  The `hooks` flag maps to the `"extras"` directory (not `"hooks"`).
- `getVariableMap(config)` — returns `{ projectName, awsRegion }` at minimum; grows as templates are authored.
- `getWorkspaceEntries(features)` — always returns `["infra","services/*","dev-gateway","packages/*"]` then
  appends `frontend`, `auth`, `e2e` if enabled. `database`, `rds`, `cicd`, `monitoring`, `hooks` do NOT
  produce separate workspace entries.
