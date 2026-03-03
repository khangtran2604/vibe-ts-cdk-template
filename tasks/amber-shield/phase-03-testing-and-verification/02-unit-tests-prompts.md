# Task: Unit Tests for Protected Prompt Flow

## ID
3.2

## Description
Write unit tests for the `--protected` flag handling in `module-prompts.ts`. Cover all code paths: flag absent, flag with `-y`, flag interactive, and flag with missing auth directory.

## Dependencies
- Task 2.2: Auth prompt flow must be implemented
- Task 3.1: Context and helper tests should pass first to isolate failures

## Inputs
- `runModulePrompts()` function from `src/module-prompts.ts`
- Existing test patterns for prompt testing (mocking clack, etc.)

## Outputs / Deliverables
- New or updated test file covering all `--protected` prompt paths

## Acceptance Criteria
- [ ] Test: `--protected -y` returns config with all 5 endpoints set to `true`
- [ ] Test: `--protected` interactive mode calls `clack.multiselect` with correct options
- [ ] Test: without `--protected`, returned config has `protectedEndpoints` as `undefined`
- [ ] Test: `--protected` on a project without `auth/` directory exits with error
- [ ] All tests pass with `pnpm test`

## Implementation Notes
Check existing test files to see how clack prompts are mocked (likely via `vi.mock`). The `detectAuthSupport` function should also be mocked to control auth directory presence. Use the same mocking patterns already established in the test suite.

## Estimated Complexity
Medium -- Requires mocking clack and detectAuthSupport across multiple scenarios.

## Status
- [ ] Not Started
