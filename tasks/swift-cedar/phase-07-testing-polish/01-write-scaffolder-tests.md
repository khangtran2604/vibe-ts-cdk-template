# Task: Write scaffolder unit tests

## ID
7.1

## Description
Create comprehensive unit tests for the scaffolding engine in `test/scaffolder.test.ts`. Tests should verify template copying, variable substitution, conditional processing, pnpm-workspace.yaml generation, and error handling. Use vitest with filesystem mocking or temp directories.

## Dependencies
- Task 3.4: Scaffolder implementation
- Task 4.6: Minimal preset verified (real templates available for integration tests)

## Inputs
- `scaffold()` function from scaffolder.ts
- Template directories
- Various `ProjectConfig` objects for different presets

## Outputs / Deliverables
- `test/scaffolder.test.ts`

## Acceptance Criteria
- [ ] Tests cover: successful scaffold for each preset (minimal, standard, full)
- [ ] Tests verify: correct directories created for each preset
- [ ] Tests verify: variable substitution applied (no leftover `{{}}` placeholders)
- [ ] Tests verify: `// @feature:X` conditionals processed correctly
- [ ] Tests verify: `pnpm-workspace.yaml` generated with correct entries per preset
- [ ] Tests verify: error when target directory already exists
- [ ] Tests verify: git init called when `gitInit: true`, skipped when false
- [ ] Tests verify: pnpm install called when `installDeps: true`, skipped when false
- [ ] All tests pass with `pnpm test`

## Implementation Notes
- Use vitest's `beforeEach`/`afterEach` to create and clean up temp directories
- Consider mocking `child_process.execSync` for git and pnpm calls to avoid side effects
- Test at the integration level: call `scaffold()` with real templates and verify output files
- Use `os.tmpdir()` for test output directories
- Test both the happy path and error cases

## Estimated Complexity
High -- Comprehensive test suite covering multiple presets and edge cases

## Status
- [ ] Not Started
