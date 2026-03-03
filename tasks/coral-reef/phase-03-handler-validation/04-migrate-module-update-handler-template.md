# Task: Migrate module update handler template to Zod validation

## ID
3.4

## Description
Replace manual validation in the module generator's update handler template with Zod `safeParse()` using the templated `Update{{EntityName}}BodySchema`.

## Dependencies
- Task 2.2: Module generator Zod schema template must exist

## Inputs
- `templates/generators/module/src/handlers/update.ts.hbs` (existing handler template)
- Schema template from task 2.2

## Outputs / Deliverables
- Modified `templates/generators/module/src/handlers/update.ts.hbs` using Zod validation

## Acceptance Criteria
- [ ] Handler imports `Update{{EntityName}}BodySchema` from `"../schemas/index.js"`
- [ ] Body validated via `Update{{EntityName}}BodySchema.safeParse()`
- [ ] Validation failure returns 400 with fieldErrors
- [ ] Success path uses `parsed.data`
- [ ] Template variables correctly placed
- [ ] Manual validation removed

## Implementation Notes
- Same pattern as task 3.2 but with template variables
- Module entities only have a `name` field

## Estimated Complexity
Medium -- Same pattern as 3.3 but for update logic

## Status
- [ ] Not Started
