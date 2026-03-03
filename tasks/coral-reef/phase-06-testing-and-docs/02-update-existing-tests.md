# Task: Update existing scaffolder and module tests

## ID
6.2

## Description
Update existing test files to assert that the new schema files, OpenAPI registrations, and spec generation scripts are created during scaffolding and module generation. This ensures the new files are not accidentally omitted.

## Dependencies
- Task 5.1: All new files must be in place before testing for their existence

## Inputs
- `test/scaffolder.test.ts` (existing scaffolder tests)
- `test/module-generator.test.ts` (existing module generator tests)
- List of all new files from the plan's "Files Summary" section

## Outputs / Deliverables
- Modified `test/scaffolder.test.ts` with assertions for new files
- Modified `test/module-generator.test.ts` with assertions for new files

## Acceptance Criteria
- [ ] Scaffolder tests assert `services/users/src/schemas/index.ts` exists in output
- [ ] Scaffolder tests assert `services/users/src/openapi.ts` exists in output
- [ ] Scaffolder tests assert `services/users/src/generate-spec.ts` exists in output
- [ ] Scaffolder tests assert `services/health/src/openapi.ts` exists in output
- [ ] Scaffolder tests assert `packages/shared-types/src/schemas.ts` exists in output
- [ ] Scaffolder tests assert dev-gateway has docs handler (check file content)
- [ ] Module generator tests assert `src/schemas/index.ts` exists in generated module
- [ ] Module generator tests assert `src/openapi.ts` exists in generated module
- [ ] Module generator tests assert `src/generate-spec.ts` exists in generated module
- [ ] All existing tests still pass

## Implementation Notes
- Follow existing test patterns -- likely using `fs.existsSync` or similar assertions
- Check what assertion style the existing tests use before adding new ones
- The dev-gateway docs handler assertion might check for the string `/docs` in the gateway file content
- Run `pnpm test` to verify all tests pass after modifications

## Estimated Complexity
Medium -- Multiple test files to update with many new assertions

## Status
- [ ] Not Started
