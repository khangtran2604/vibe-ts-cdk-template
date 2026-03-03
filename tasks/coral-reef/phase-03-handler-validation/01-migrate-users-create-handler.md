# Task: Migrate users create handler to Zod validation

## ID
3.1

## Description
Replace the manual validation logic in the users service create handler with Zod `safeParse()`. The current handler manually checks `typeof name !== "string"` etc. -- this should be replaced with `CreateUserBodySchema.safeParse()` which provides structured field-level errors automatically.

## Dependencies
- Task 2.1: Users service Zod schemas must exist to import `CreateUserBodySchema`

## Inputs
- `templates/services/users/src/handlers/create-user.ts` (existing handler with manual validation)
- `CreateUserBodySchema` from `../schemas/index.js`

## Outputs / Deliverables
- Modified `templates/services/users/src/handlers/create-user.ts` using Zod validation

## Acceptance Criteria
- [ ] Handler imports `CreateUserBodySchema` from `"../schemas/index.js"`
- [ ] `JSON.parse(event.body)` result is validated via `CreateUserBodySchema.safeParse()`
- [ ] On validation failure: returns 400 with `VALIDATION_ERROR` code and `fieldErrors` map
- [ ] `fieldErrors` are derived from `parsed.error.issues` (path.join(".") -> message)
- [ ] On success: destructures `parsed.data` for the validated fields
- [ ] Response envelope format is preserved (success, error, timestamp)
- [ ] Manual type checks (typeof, trim, etc.) are removed
- [ ] Existing error handling for missing body is preserved

## Implementation Notes
- The `JSON.parse(event.body)` call should still be wrapped in try/catch for malformed JSON
- Zod's `safeParse` returns `{ success: true, data }` or `{ success: false, error }` -- no exceptions
- Map Zod issues to fieldErrors: `for (const issue of parsed.error.issues) { fieldErrors[issue.path.join(".")] = issue.message; }`
- Keep HEADERS constant usage unchanged
- Reference the plan's Phase 4 code sample for exact implementation

## Estimated Complexity
Medium -- Must carefully replace validation while preserving error response format

## Status
- [x] Complete
