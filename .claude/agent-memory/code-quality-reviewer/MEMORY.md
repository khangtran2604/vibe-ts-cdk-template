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
- All files with `{{variable}}` placeholders MUST use `.hbs` extension

## Template Processing Pipeline
- `replaceVariables()` is called on ALL non-binary text files (not just .hbs)
- `.hbs` suffix is stripped during `renameFile()` -- it's a naming convention, not a processing gate
- Regex: `/^(\s*)\/\/ @feature:(\w+) (.*)$/` -- supports indented annotations
- Binary files (svg, png, etc.) copied byte-for-byte (no transforms)
- Path traversal protection built into `copyDir()`

## CDK Stack Conventions (from base-stack.ts)
- All stacks extend `ServiceStack` which extends `cdk.Stack`
- `this.config.lambdaMemoryMb` / `this.config.lambdaTimeoutSecs` for Lambda config
- `this.removalPolicy` (DESTROY for dev, RETAIN for prod)
- `this.logRetention()` maps `logRetentionDays` to CDK enum
- `this.resourceName("prefix")` adds `-<stage>` suffix
- Runtime: `lambda.Runtime.NODEJS_22_X`

## Recurring Issues (flagged across reviews)
- Phase 1-3: `CLI_VERSION` duplicated from package.json; `noExternal: []` no-op; `execSync` lacks timeout
- Phase 4: `!this.stage === "prod"` operator precedence bug; `source-map-support/register` missing dep
- Phase 5: auth-stack hardcodes memorySize/timeout; SUBDIR_TEMPLATE_DIRS comment stale; e2e title mismatch
- Phase 6: `--require-approval never` in prod deploy; SNS fallback to example.com; database-client missing vitest.config.ts
- Module gen: missing input validation on moduleName before code injection; no duplicate-injection guard

## Module Injection System
- Markers: `// @module-inject:import`, `// @module-inject:instance`, `// @module-inject:route`
- `injectBeforeMarker()` inserts line before marker, preserves marker for future injections
- Marker indentation is applied to injected line
- Generated infra imports omit `.js` extension (different tsconfig from CLI tool)
- NO_FEATURES const satisfies copyDir signature for module templates (no @feature lines)

## File Layout
- `src/scaffolder.ts` -- core scaffolding engine, SUBDIR_TEMPLATE_DIRS set
- `src/module-generator.ts` -- module generator; copies templates/generators/module/, injects into infra+gateway
- `src/module-helpers.ts` -- toPascalCase, toEntityName, getModuleVariableMap, injectBeforeMarker
- `src/module-context.ts` -- detectProjectContext, readProjectName, scanNextPort
- `src/template-helpers.ts` -- getTemplateDirs, getVariableMap, getWorkspaceEntries
- `src/utils/fs.ts` -- copyDir, renameFile, replaceVariables, processConditionals
- `src/utils/paths.ts` -- resolveTemplateRoot, pathExists
- `templates/infra/src/stacks/base-stack.ts` -- ServiceStack base class
- `templates/infra/src/index.ts.hbs` -- CDK app entry; `// @feature:X` gates stack imports/instantiations
- `templates/generators/` -- module generator templates (module/, infra-stack/)

## Template Merge Behavior
- SUBDIR_TEMPLATE_DIRS: services, infra, dev-gateway, packages, frontend, auth, e2e
- Root-merge dirs (NOT in SUBDIR_TEMPLATE_DIRS): base, database, cicd, monitoring, extras
- Root-merge means `templates/database/packages/...` -> `projectDir/packages/...`
- database-client and monitoring land under `packages/*` workspace glob automatically
- `_github/` -> `.github/`, `_husky/` -> `.husky/` via renameFile() on directories

## Test Patterns
- `vi.hoisted()` for mock data referenced in `vi.mock()` factories
- `vi.stubEnv()` for module-level env var guards
- Dynamic `await import()` after vi.mock/vi.stubEnv for modules with top-level side effects
- `copyDir` integration tests use real temp dirs

## Package Versions
- All dependency versions pinned in CLAUDE.md -- always verify with `npm view`
