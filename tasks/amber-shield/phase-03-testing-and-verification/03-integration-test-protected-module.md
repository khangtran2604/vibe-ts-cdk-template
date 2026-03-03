# Task: Integration Test for Protected Module Generation

## ID
3.3

## Description
Write an integration test that exercises the full module generation pipeline with `--protected`. Verify that a protected module's generated stack file contains authorizer code, and that an unprotected module's stack file has no authorizer code. This is the final verification that all pieces work together.

## Dependencies
- Task 2.1: Stack template must have auth placeholders
- Task 2.3: CLI must accept `--protected` flag
- Task 3.1: Unit tests should pass first
- Task 3.2: Prompt tests should pass first

## Inputs
- Full CLI pipeline (`src/index.ts` through `module-generator.ts`)
- Existing integration test patterns in `test/` directory

## Outputs / Deliverables
- New or updated integration test file for protected module generation

## Acceptance Criteria
- [ ] Test: generating a module with `--protected -y` produces a stack file containing `TokenAuthorizer`, `Fn.importValue`, `authorizationType: apigateway.AuthorizationType.CUSTOM`
- [ ] Test: generating a module without `--protected` produces a stack file with NO authorizer code
- [ ] Test: the unprotected module output is identical to pre-change behavior (no extra whitespace, blank lines, etc.)
- [ ] All tests pass with `pnpm test`

## Implementation Notes
The integration test should:
1. Set up a temp directory simulating a scaffolded standard project (at minimum, an `auth/` directory must exist)
2. Call the module generator programmatically (or the relevant function) with a config that includes `protectedEndpoints`
3. Read the generated `stack.ts` file and assert on its contents

Follow existing integration test patterns. If the project uses snapshot testing for generated files, consider adding a snapshot for the protected case.

## Estimated Complexity
Medium -- Requires temp directory setup and file content assertions, but follows established patterns.

## Status
- [ ] Not Started
