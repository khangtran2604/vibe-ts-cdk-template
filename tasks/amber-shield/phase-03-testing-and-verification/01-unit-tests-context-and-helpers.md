# Task: Unit Tests for detectAuthSupport and Auth Variable Map

## ID
3.1

## Description
Write unit tests for `detectAuthSupport()` in module-context and for the auth variable generation in `getModuleVariableMap()`. These tests verify the core logic independently before integration testing.

## Dependencies
- Task 1.2: `detectAuthSupport()` must be implemented
- Task 1.3: Auth variables in `getModuleVariableMap()` must be implemented

## Inputs
- `detectAuthSupport()` function from `src/module-context.ts`
- `getModuleVariableMap()` function from `src/module-helpers.ts`
- Existing test patterns in `test/` directory

## Outputs / Deliverables
- New or updated test file(s) covering auth context detection and variable map generation

## Acceptance Criteria
- [ ] `detectAuthSupport` test: returns `true` when `auth/` directory exists in temp project dir
- [ ] `detectAuthSupport` test: returns `false` when `auth/` directory does not exist
- [ ] Variable map test: when `protectedEndpoints` is undefined, all 6 auth variables are empty strings
- [ ] Variable map test: when all endpoints are protected, `authorizerSetup` contains `TokenAuthorizer`, `Fn.importValue`, `fromFunctionArn`
- [ ] Variable map test: per-endpoint variables are empty for unprotected endpoints, populated for protected ones
- [ ] Variable map test: mixed protection (e.g., only create + delete protected) produces correct per-endpoint values
- [ ] All tests pass with `pnpm test`

## Implementation Notes
Follow existing test file conventions in the `test/` directory. Use temp directories for the `detectAuthSupport` tests. For variable map tests, call the function with different `protectedEndpoints` configurations and assert on the returned map entries.

## Estimated Complexity
Medium -- Multiple test scenarios for both functions.

## Status
- [ ] Not Started
