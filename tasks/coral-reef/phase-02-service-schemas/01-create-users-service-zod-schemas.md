# Task: Create users service Zod schemas

## ID
2.1

## Description
Create Zod schemas for the users service that define User, CreateUserBody, and UpdateUserBody entities. These schemas use `.openapi()` to register with the OpenAPI generator, and derive TypeScript types via `z.infer<>`. This replaces manual interface definitions while maintaining the same type shapes.

## Dependencies
- Task 1.1: Shared-types schemas must exist (users schemas follow the same pattern and will reference envelope schemas in Phase 4)

## Inputs
- Existing type definitions in `templates/services/users/src/types/index.ts`
- Plan Phase 2 code sample

## Outputs / Deliverables
- `templates/services/users/src/schemas/index.ts` containing UserSchema, CreateUserBodySchema, UpdateUserBodySchema, and derived TypeScript types

## Acceptance Criteria
- [ ] File `templates/services/users/src/schemas/index.ts` exists
- [ ] `extendZodWithOpenApi(z)` is called
- [ ] `UserSchema` has id (uuid), name (min 1), email (email), createdAt (datetime), updatedAt (datetime)
- [ ] `CreateUserBodySchema` has name (min 1) and email (email)
- [ ] `UpdateUserBodySchema` has name (optional) and email (optional)
- [ ] All schemas call `.openapi("SchemaName")` for OpenAPI registration
- [ ] TypeScript types are exported via `z.infer<typeof Schema>`
- [ ] Types match the existing interface definitions exactly

## Implementation Notes
- Use `extendZodWithOpenApi(z)` at file top to enable `.openapi()` method
- The `.openapi("Name")` call registers the schema with a reference name for the OpenAPI spec
- UpdateUserBody fields should all be `.optional()` since partial updates are supported
- Export both schemas (for validation/OpenAPI) and types (for handler type annotations)

## Estimated Complexity
Medium -- Requires careful alignment with existing type definitions

## Status
- [x] Complete
