# Task: Write module-helpers Tests

## ID
5.1

## Description
Write comprehensive unit tests for all pure functions in `src/module-helpers.ts`. Since these are pure functions with no I/O, tests should be straightforward and cover edge cases.

## Dependencies
- Task 1.2: The functions being tested must exist

## Inputs
- `src/module-helpers.ts` with all exported functions

## Outputs / Deliverables
- New file `test/module-helpers.test.ts`

## Acceptance Criteria
- [ ] Tests for `toPascalCase`: single word ("orders" -> "Orders"), hyphenated ("order-items" -> "OrderItems"), already PascalCase
- [ ] Tests for `toEntityName`: plural to singular ("orders" -> "Order"), hyphenated plural ("order-items" -> "OrderItem"), already singular
- [ ] Tests for `toEntityNameLower`: same cases as `toEntityName` but camelCase output
- [ ] Tests for `toFlatLower`: removes hyphens and lowercases
- [ ] Tests for `getModuleVariableMap`: returns correct keys and values for a sample config
- [ ] Tests for `injectBeforeMarker`: inserts line before marker, preserves marker, handles missing marker
- [ ] All tests pass: `pnpm test`

## Implementation Notes
- Use vitest's `describe`/`it`/`expect` pattern consistent with existing tests in `test/`.
- For `injectBeforeMarker`, test with multi-line strings that simulate real file content with markers.
- Test edge cases: empty strings, strings with no hyphens, single-character inputs.

## Estimated Complexity
Medium -- Many test cases across multiple functions, but all straightforward.

## Status
- [ ] Not Started
