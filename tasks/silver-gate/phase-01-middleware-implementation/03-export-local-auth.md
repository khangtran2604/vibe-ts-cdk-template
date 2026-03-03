# Task: Export localAuth from lambda-utils Index

## ID
1.3

## Description
Add the `localAuth` export to `templates/packages/lambda-utils/src/index.ts` so generated projects can import it from the `@{projectName}/lambda-utils` package.

## Dependencies
- Task 1.1: The `local-auth.ts` file must exist before it can be exported

## Inputs
- `templates/packages/lambda-utils/src/index.ts` (existing barrel export file)

## Outputs / Deliverables
- Modified `templates/packages/lambda-utils/src/index.ts`

## Acceptance Criteria
- [ ] `export { localAuth } from "./middleware/local-auth.js";` added to the barrel exports
- [ ] Export uses `.js` extension (ESM convention)
- [ ] Existing exports unchanged

## Implementation Notes
- Follow the same pattern as existing exports in the file. Place it near other middleware exports if they exist.

## Estimated Complexity
Low -- Single line addition.

## Status
- [x] Complete
