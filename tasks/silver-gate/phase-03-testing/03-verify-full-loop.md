# Task: Run Full Verification Loop

## ID
3.3

## Description
Execute the complete verification sequence from the plan: run all tests, build the CLI, scaffold a standard project, generate protected and unprotected modules, and verify the generated output contains correct auth middleware configuration.

## Dependencies
- Task 3.1: Module helper tests must pass
- Task 3.2: Module generator tests must pass

## Inputs
- Built CLI (`pnpm build`)
- The full verification script from the plan

## Outputs / Deliverables
- Confirmation that all verification steps pass
- Any bug fixes discovered during verification

## Acceptance Criteria
- [ ] `pnpm test` passes with all existing and new tests
- [ ] `pnpm build` succeeds
- [ ] Generated standard project with protected module contains correct `localAuth` code in `app.ts`
- [ ] Generated unprotected module does NOT contain `localAuth` code
- [ ] No regressions in minimal, standard, or full preset generation

## Implementation Notes
- Follow the verification script in the plan exactly.
- If any step fails, fix the issue and re-verify from the beginning.
- This task is the final gate before the feature is considered complete.

## Estimated Complexity
Low -- Execution and verification, no new code.

## Status
- [ ] Not Started
