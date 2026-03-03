# Task: Write module-context Tests

## ID
5.2

## Description
Write tests for `src/module-context.ts` functions using mocked filesystem operations. These tests verify project detection heuristics and port scanning logic.

## Dependencies
- Task 1.3: The functions being tested must exist

## Inputs
- `src/module-context.ts` with all exported functions

## Outputs / Deliverables
- New file `test/module-context.test.ts`

## Acceptance Criteria
- [ ] Tests for `detectProjectContext`: valid project directory passes, missing directories/files cause clear errors
- [ ] Tests for `readProjectName`: reads name from package.json, handles missing file, handles missing name field
- [ ] Tests for `scanNextPort`: finds next port from multiple services, handles no existing services, handles malformed dev-server files
- [ ] All filesystem operations are mocked (tests do not touch real filesystem)
- [ ] All tests pass: `pnpm test`

## Implementation Notes
- Use vitest's `vi.mock` to mock `fs/promises` operations.
- For `scanNextPort`, mock `readdir` to return service directories and `readFile` to return dev-server content with PORT constants.
- Test the happy path and error paths for each function.

## Estimated Complexity
Medium -- Mocking filesystem operations requires careful setup but logic is straightforward.

## Status
- [x] Complete
