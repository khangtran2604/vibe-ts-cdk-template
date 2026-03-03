# Task: Create module generator Zod schema template

## ID
2.2

## Description
Create the templated Zod schema file for the module generator. This uses `{{EntityName}}` and `{{entityNameLower}}` template variables so that when a developer runs `module orders`, it generates Order-specific Zod schemas. The module template has only a `name` field (unlike users which has name + email).

## Dependencies
- Task 1.1: Shared-types schemas must exist as the pattern reference

## Inputs
- Existing module generator types template at `templates/generators/module/src/types/index.ts.hbs`
- Users service schemas (Task 2.1) as the pattern to follow
- Template variable conventions from CLAUDE.md

## Outputs / Deliverables
- `templates/generators/module/src/schemas/index.ts.hbs` containing templated entity schemas

## Acceptance Criteria
- [ ] File `templates/generators/module/src/schemas/index.ts.hbs` exists
- [ ] Uses `{{EntityName}}` for schema names (e.g., `{{EntityName}}Schema`)
- [ ] Uses `{{entityNameLower}}` where appropriate for lowercase references
- [ ] `Create{{EntityName}}BodySchema` has only a `name` field (min 1)
- [ ] `Update{{EntityName}}BodySchema` has `name` as optional
- [ ] `{{EntityName}}Schema` has id, name, createdAt, updatedAt
- [ ] All schemas call `.openapi("{{EntityName}}")` etc.
- [ ] TypeScript types are derived via `z.infer<>`
- [ ] Template variables match existing conventions in the module generator

## Implementation Notes
- The module generator creates simple entities with only a `name` field -- do not add `email`
- Follow the exact same pattern as users schemas but with template variables
- Check `templates/generators/module/src/types/index.ts.hbs` for the existing field definitions to mirror
- The `.hbs` extension marks this as a template file with `{{variable}}` placeholders (not actual Handlebars)

## Estimated Complexity
Medium -- Template variable substitution adds complexity on top of the schema pattern

## Status
- [ ] Not Started
