# Task: Migrate users update handler to Zod validation

## ID
3.2

## Description
Replace manual validation in the users service update handler with Zod `safeParse()` using `UpdateUserBodySchema`. The update handler validates optional fields for partial updates.

## Dependencies
- Task 2.1: Users service Zod schemas must exist to import `UpdateUserBodySchema`

## Inputs
- `templates/services/users/src/handlers/update-user.ts` (existing handler)
- `UpdateUserBodySchema` from `../schemas/index.js`

## Outputs / Deliverables
- Modified `templates/services/users/src/handlers/update-user.ts` using Zod validation

## Acceptance Criteria
- [ ] Handler imports `UpdateUserBodySchema` from `"../schemas/index.js"`
- [ ] Body validated via `UpdateUserBodySchema.safeParse()`
- [ ] On validation failure: returns 400 with fieldErrors from Zod issues
- [ ] On success: uses `parsed.data` for the validated fields
- [ ] Existing path parameter extraction (`event.pathParameters.id`) unchanged
- [ ] Existing 404 logic unchanged
- [ ] Manual type checks removed

## Implementation Notes
- Same pattern as create handler (task 3.1) but with `UpdateUserBodySchema`
- `UpdateUserBodySchema` has all optional fields, so an empty object `{}` is technically valid
- Ensure the handler still checks that at least one field is provided if that was the previous behavior

## Estimated Complexity
Medium -- Same pattern as 3.1 but for update logic

## Status
- [x] Complete
