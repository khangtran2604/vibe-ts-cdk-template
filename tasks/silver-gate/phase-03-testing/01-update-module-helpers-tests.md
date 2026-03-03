# Task: Update module-helpers Tests for Auth Variables

## ID
3.1

## Description
Update `test/module-helpers.test.ts` to cover the 7 new auth-related template variables. This includes updating the key count assertion and adding test cases for protected, unprotected, and mixed-protection scenarios.

## Dependencies
- Task 2.1: The module-helpers implementation must be complete to test against

## Inputs
- `test/module-helpers.test.ts` (existing test file)
- The 7 new variable names and their expected values

## Outputs / Deliverables
- Modified `test/module-helpers.test.ts`

## Acceptance Criteria
- [ ] Key count assertion updated from 14 to 21 (7 new variables)
- [ ] Test: unprotected module produces empty strings for all 7 auth variables
- [ ] Test: fully protected module produces populated values for all 7 auth variables
- [ ] Test: per-endpoint granularity -- only selected endpoints get `"auth, "` prefix
- [ ] Test: `localAuthImport` contains `{{projectName}}` placeholder (or resolved project name) for proper import path
- [ ] Test: `localAuthConst` is present when any endpoint is protected
- [ ] All existing tests continue to pass

## Implementation Notes
- Follow the existing test patterns in the file for variable map assertions.
- Test at least 3 scenarios: no protection, full protection, partial protection (e.g., only create and delete protected).

## Estimated Complexity
Medium -- Multiple test scenarios with assertion details.

## Status
- [ ] Not Started
