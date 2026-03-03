# Task: Create module-prompts.ts

## ID
4.1

## Description
Create `src/module-prompts.ts` with an interactive prompt flow for the module subcommand. This collects the module name, validates it, detects the project context, and returns a complete `ModuleConfig`.

## Dependencies
- Task 1.2: Uses string transform functions for entity name derivation
- Task 1.3: Uses `detectProjectContext()`, `scanNextPort()`, `readProjectName()`

## Inputs
- `ModuleConfig` from `src/types.ts`
- Context detection from `src/module-context.ts`
- String helpers from `src/module-helpers.ts`
- CLI flags (name from argument, `--no-install`, `-y`)

## Outputs / Deliverables
- New file `src/module-prompts.ts` with exported `runModulePrompts(name, flags)` function

## Acceptance Criteria
- [ ] `runModulePrompts(name, flags)` returns a `ModuleConfig`
- [ ] Validates module name is kebab-case (a-z, 0-9, hyphens only)
- [ ] If `-y` flag is set, accepts all defaults without prompting
- [ ] If `-y` is not set, prompts user to confirm module name and install preference
- [ ] Calls `detectProjectContext()` and handles errors gracefully (e.g., "This doesn't look like a scaffolded project")
- [ ] Auto-assigns port via `scanNextPort()`
- [ ] Auto-derives entity name via `toEntityName()`
- [ ] Uses `@clack/prompts` for consistent UI with the existing scaffolding prompts
- [ ] Shows a summary of what will be generated before proceeding
- [ ] Build succeeds (`pnpm build`)

## Implementation Notes
- Follow the same UI patterns as `src/prompts.ts` for consistency (intro banner, spinner, confirm, outro).
- The module name comes from the CLI argument, not an interactive prompt. But validation should still happen, and an error shown if invalid.
- Consider showing: module name, entity name, port, target directory in the summary.

## Estimated Complexity
Medium -- Interactive prompt flow with validation and context detection.

## Status
- [ ] Not Started
