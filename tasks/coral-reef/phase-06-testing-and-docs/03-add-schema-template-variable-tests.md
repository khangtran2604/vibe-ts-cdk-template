# Task: Add schema template variable tests

## ID
6.3

## Description
Add new tests that verify template variable substitution in the module generator's schema and OpenAPI files produces valid TypeScript output. This ensures that `{{EntityName}}`, `{{moduleName}}`, etc. are correctly replaced.

## Dependencies
- Task 2.2: Module generator schema template must exist
- Task 4.2: Module generator OpenAPI template must exist

## Inputs
- `templates/generators/module/src/schemas/index.ts.hbs`
- `templates/generators/module/src/openapi.ts.hbs`
- `templates/generators/module/src/generate-spec.ts.hbs`
- Existing test patterns in `test/module-generator.test.ts`

## Outputs / Deliverables
- New test cases in `test/module-generator.test.ts` (or a new test file if appropriate)

## Acceptance Criteria
- [ ] Test generates a module (e.g., "orders") and verifies `schemas/index.ts` content
- [ ] Verifies `OrderSchema` (not `{{EntityName}}Schema`) appears in generated output
- [ ] Verifies `CreateOrderBodySchema` appears in generated output
- [ ] Verifies `openapi.ts` contains `/orders` path registrations
- [ ] Verifies no unsubstituted `{{...}}` template variables remain in any generated file
- [ ] Tests pass with `pnpm test`

## Implementation Notes
- The most important assertion: no `{{` or `}}` strings remain in generated files (indicates missed substitution)
- Generate a test module with a known name and then read the output files to verify content
- Follow existing test patterns for module generation (likely uses a temp directory)
- Consider testing with different module names to verify pluralization and casing

## Estimated Complexity
Medium -- Requires running module generation in tests and verifying file contents

## Status
- [ ] Not Started
