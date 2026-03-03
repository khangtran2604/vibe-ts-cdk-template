# Task: Create module generator OpenAPI template

## ID
4.2

## Description
Create the templated OpenAPI route registration file for the module generator. Same pattern as users but with `{{EntityName}}`, `{{moduleName}}`, `{{entityNameLower}}` template variables. Module entities only have a `name` field.

## Dependencies
- Task 2.2: Module generator Zod schema template must exist

## Inputs
- Users service `openapi.ts` (task 4.1) as the pattern
- Module generator schema template from task 2.2

## Outputs / Deliverables
- `templates/generators/module/src/openapi.ts.hbs`

## Acceptance Criteria
- [ ] File uses `{{EntityName}}`, `{{moduleName}}`, `{{entityNameLower}}` template variables
- [ ] Creates and exports an `OpenAPIRegistry` instance
- [ ] Registers all 5 CRUD endpoints with templated paths (e.g., `/{{moduleName}}`, `/{{moduleName}}/{id}`)
- [ ] Request/response schemas reference the templated schema names
- [ ] Envelope schemas imported from shared-types
- [ ] Template variable placement matches existing module generator conventions

## Implementation Notes
- Follow the exact same structure as users `openapi.ts` but replace hardcoded names with template variables
- Path prefix should be `/{{moduleName}}` (plural, lowercase)
- Schema references: `{{EntityName}}Schema`, `Create{{EntityName}}BodySchema`, etc.
- Check existing module generator templates for the correct variable naming conventions

## Estimated Complexity
High -- Complex template with many variable substitutions across 5 endpoint registrations

## Status
- [ ] Not Started
