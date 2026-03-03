# Task: Update module-generator Tests for Auth Integration

## ID
3.2

## Description
Update `test/module-generator.test.ts` to verify that the full module generation pipeline correctly includes or excludes `localAuth` middleware in the generated `app.ts` file based on the `--protected` flag.

## Dependencies
- Task 1.1: localAuth middleware must exist in templates
- Task 1.2: Lambda adapter must read authorizerClaims
- Task 1.3: localAuth must be exported from lambda-utils
- Task 2.1: Module helpers must define auth variables
- Task 2.2: app.ts template must include auth placeholders

## Inputs
- `test/module-generator.test.ts` (existing test file)
- Generated `app.ts` file content from module generation

## Outputs / Deliverables
- Modified `test/module-generator.test.ts`

## Acceptance Criteria
- [ ] Test: protected module's `app.ts` contains `localAuth` import statement
- [ ] Test: protected module's `app.ts` contains `const auth = localAuth()`
- [ ] Test: protected module's `app.ts` contains `auth, lambdaToHono(` pattern on route lines
- [ ] Test: unprotected module's `app.ts` does NOT contain `localAuth` anywhere
- [ ] Test: mixed protection -- only protected routes have `auth, ` prefix
- [ ] All existing module generator tests continue to pass

## Implementation Notes
- These are integration-level tests that exercise the full pipeline: config -> variable map -> template rendering.
- Use string matching or regex on the generated file content to verify auth middleware presence.
- The existing test infrastructure likely already generates modules and reads output files -- follow that pattern.

## Estimated Complexity
Medium -- Integration tests requiring full pipeline execution and content assertions.

## Status
- [ ] Not Started
