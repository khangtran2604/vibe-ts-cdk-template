# Task: Migrate module create handler template to Zod validation

## ID
3.3

## Description
Replace manual validation in the module generator's create handler template with Zod `safeParse()`. Uses template variables for the schema import names.

## Dependencies
- Task 2.2: Module generator Zod schema template must exist

## Inputs
- `templates/generators/module/src/handlers/create.ts.hbs` (existing handler template)
- Schema template from task 2.2

## Outputs / Deliverables
- Modified `templates/generators/module/src/handlers/create.ts.hbs` using Zod validation

## Acceptance Criteria
- [ ] Handler imports `Create{{EntityName}}BodySchema` from `"../schemas/index.js"`
- [ ] Body validated via `Create{{EntityName}}BodySchema.safeParse()`
- [ ] Validation failure returns 400 with fieldErrors
- [ ] Success path uses `parsed.data`
- [ ] Template variables are correctly placed
- [ ] Manual validation checks removed

## Implementation Notes
- Same pattern as task 3.1 but with `{{EntityName}}` template variables
- Module entities only have a `name` field (not name + email like users)
- Ensure template variable placement matches existing conventions in the file

## Estimated Complexity
Medium -- Template variable handling adds slight complexity

## Status
- [x] Complete
