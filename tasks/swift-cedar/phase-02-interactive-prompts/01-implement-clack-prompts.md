# Task: Implement interactive prompts with @clack/prompts

## ID
2.1

## Description
Create `src/prompts.ts` with the full interactive prompt flow using `@clack/prompts`. The prompts collect project name, preset selection, AWS region, optional RDS flag (for full preset), git init preference, and dependency install preference. The function returns a complete `ProjectConfig` object.

## Dependencies
- Task 1.4: types.ts must exist with ProjectConfig, Preset, FeatureFlags interfaces
- Task 1.1: package.json must have @clack/prompts dependency

## Inputs
- `ProjectConfig` interface from types.ts
- CLI flags that may pre-fill some values (passed as partial config)
- Preset descriptions for display:
  - minimal: CDK + Services (Lambda + API Gateway)
  - standard: + Frontend (Vite React) + Auth (Cognito)
  - full: + Database, CI/CD, Monitoring, Pre-commit hooks

## Outputs / Deliverables
- `src/prompts.ts` exporting a `runPrompts(partialConfig?)` function that returns `ProjectConfig`

## Acceptance Criteria
- [ ] `runPrompts()` displays the clack intro banner with CLI name and description
- [ ] Prompts for: project name (text), preset (select), AWS region (text with default), RDS (confirm, only if full preset), git init (confirm), install deps (confirm)
- [ ] If a value is already provided via CLI flags, the corresponding prompt is skipped
- [ ] `-y` flag skips all prompts and uses sensible defaults
- [ ] User cancellation (Ctrl+C) is handled gracefully with `clack.outro` and `process.exit(0)`
- [ ] Project name is validated: no spaces, lowercase, valid npm package name
- [ ] Returns a complete `ProjectConfig` object
- [ ] The RDS prompt only appears when preset is `full`

## Implementation Notes
- Use `@clack/prompts` API: `intro()`, `text()`, `select()`, `confirm()`, `outro()`, `isCancel()`
- The function should accept a partial config from CLI flags and only prompt for missing values
- Default region could be `us-east-1` or read from AWS_DEFAULT_REGION env var
- Validate project name: lowercase, no spaces, valid characters for a directory name
- Consider using `clack.spinner()` placeholder text for the scaffold step (will be wired in Phase 3)

## Estimated Complexity
Medium -- Multiple prompts with conditional logic and validation

## Status
- [ ] Not Started
