# Code Quality Reviewer Memory

## Project Overview
- CLI scaffolding tool (like create-t3-app for AWS CDK)
- ESM-only project (`"type": "module"` in package.json)
- Build: tsup targeting node24, ESM format, shebang banner
- Runtime: Node 24.x, pnpm
- CLI: commander (args) + @clack/prompts (interactive UI)

## Key Conventions
- All relative imports MUST use `.js` extensions (NodeNext module resolution)
- `import type` used for type-only imports
- No template engine -- uses `String.replaceAll("{{key}}", value)` + `// @feature:X` conditional lines
- `pnpm-workspace.yaml` must be built programmatically, not templated
- Template dotfiles use `_` prefix (e.g., `_gitignore` -> `.gitignore`)
- Stack-per-service CDK pattern; each service gets its own API Gateway

## Template Processing Pipeline
- Regex: `/^\/\/ @feature:(\w+) (.*)$/` -- group 1 is feature name, group 2 is the code to keep
- ONLY `.hbs` files get `{{variable}}` substitution; plain `.ts`/`.json` files copied as-is
- Binary files copied byte-for-byte (no transforms)
- Common mistake: putting `{{projectName}}` in `.ts` files instead of `.ts.hbs`

## Recurring Issues (flagged across Phase 1-3 reviews)
- `CLI_VERSION` in constants.ts duplicated from package.json
- Commander always defines `rds`, `git`, `install`, `yes` -- CliFlags marks optional
- `noExternal: []` in tsup.config.ts is a no-op
- Missing: dedicated unit tests for scaffolder.ts, git.ts, pnpm.ts
- `initGit`/`installDeps` are `async` but use `execSync` (sync)
- `execSync` calls lack `timeout` option
- Unused imports in fs.ts: `basename`, `stat`

## Phase 4 Issues Found
- **CRITICAL**: `!this.stage === "prod"` operator precedence bug in CDK stacks
- `{{projectName}}` in plain `.ts` test files -- substitution skipped
- `source-map-support/register` imported but not in dependencies
- HealthStack hardcodes ONE_WEEK retention vs UsersStack uses config-driven
- Infra package.json uses CJS (`ts-node`) but rest of project is ESM

## File Layout
- `src/index.ts` -- CLI entry point (commander setup)
- `src/types.ts` -- ProjectConfig, Preset, FeatureFlags
- `src/scaffolder.ts` -- core scaffolding engine
- `src/template-helpers.ts` -- feature flags to template mapping
- `src/utils/` -- fs, git, pnpm, logger helpers
- `templates/` -- template files for generated projects
- `test/` -- CLI tests (vitest)

## Test Patterns
- `vi.hoisted()` for mock data referenced in `vi.mock()` factories
- `vi.mock("@clack/prompts")` replaces all clack functions with spies
- `copyDir` integration tests use real temp dirs

## Package Versions
- All dependency versions pinned in CLAUDE.md -- always verify with `npm view`
