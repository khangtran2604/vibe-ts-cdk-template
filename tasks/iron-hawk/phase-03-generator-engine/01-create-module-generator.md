# Task: Create module-generator.ts

## ID
3.1

## Description
Create `src/module-generator.ts` with the core `generateModule(config: ModuleConfig)` function that orchestrates the entire module generation process: copying templates, substituting variables, writing the CDK stack, injecting code into existing files, and optionally running pnpm install.

## Dependencies
- Task 1.2: Uses `getModuleVariableMap()` and `injectBeforeMarker()`
- Task 1.3: Uses `detectProjectContext()` for validation
- Task 1.4: Uses `resolveTemplateRoot()` for template path resolution
- Task 2.1: Depends on marker comments existing in templates
- Task 2.2: Depends on CRUD service templates existing
- Task 2.3: Depends on CDK stack template existing

## Inputs
- `ModuleConfig` from `src/types.ts`
- Helper functions from `src/module-helpers.ts`
- `resolveTemplateRoot()` from `src/utils/paths.ts`
- Existing `copyDir()` and `replaceVariables()` from `src/utils/fs.ts`
- Template files from `templates/generators/`

## Outputs / Deliverables
- New file `src/module-generator.ts` with exported `generateModule()` function

## Acceptance Criteria
- [ ] `generateModule(config)` performs all steps in order:
  1. Resolve template root and build variable map
  2. Guard: throw if `services/<moduleName>/` already exists
  3. Copy `templates/generators/module/` to `services/<moduleName>/` with variable substitution
  4. Process CDK stack template and write to `infra/src/stacks/modules/<moduleName>-stack.ts`
  5. Inject import line into `infra/src/index.ts` at `// @module-inject:import` marker
  6. Inject stack instantiation into `infra/src/index.ts` at `// @module-inject:instance` marker
  7. Inject route into `dev-gateway/src/gateway.ts` at `// @module-inject:route` marker
  8. Optionally run `pnpm install` if `config.installDeps` is true
- [ ] The injected import follows the pattern: `import { {{ModuleName}}Stack } from "./stacks/modules/{{moduleName}}-stack";`
- [ ] The injected instance follows the pattern: `new {{ModuleName}}Stack(app, "{{ModuleName}}Stack", { env });`
- [ ] The injected route follows the pattern: `"/{{moduleName}}": "http://localhost:{{port}}",`
- [ ] Duplicate module guard provides a clear, user-friendly error message
- [ ] Function uses `@clack/prompts` spinner or log for progress feedback
- [ ] Build succeeds (`pnpm build`)

## Implementation Notes
- Reuse the existing `copyDir()` from `src/utils/fs.ts` for recursive template copying with variable substitution. Check its signature -- it likely already handles `.hbs` stripping and `_` prefix conversion.
- The `infra/src/stacks/modules/` subdirectory may not exist yet; create it if needed.
- For the injection step, read the target file, call `injectBeforeMarker`, then write it back.
- The pnpm install step should use the existing `runPnpmInstall` utility from `src/utils/pnpm.ts` if available.
- Consider wrapping the whole function in a try/catch that cleans up partially generated files on failure (optional but nice to have).

## Estimated Complexity
High -- Orchestrates multiple file operations, template processing, and code injection with error handling.

## Status
- [ ] Not Started
