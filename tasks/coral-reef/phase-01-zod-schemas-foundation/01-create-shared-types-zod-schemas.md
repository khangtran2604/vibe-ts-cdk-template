# Task: Create shared-types Zod schemas

## ID
1.1

## Description
Create the foundational Zod schemas in the shared-types package that define the common API envelope types (success response, error response, pagination). These schemas serve as the single source of truth -- they provide runtime validation, TypeScript type inference via `z.infer<>`, and OpenAPI spec generation via `zod-to-openapi`. All services will import these envelope schemas.

## Dependencies
None

## Inputs
- Existing TypeScript interfaces in `templates/packages/shared-types/src/api.ts` (the current manual type definitions to mirror)
- Plan specification for schema structure

## Outputs / Deliverables
- `templates/packages/shared-types/src/schemas.ts` containing:
  - `ApiResponseSchema` (generic success envelope)
  - `ApiErrorResponseSchema` (error envelope with fieldErrors)
  - `PaginationMetaSchema` (pagination metadata)
  - `PaginatedResultSchema` (generic paginated result)

## Acceptance Criteria
- [ ] File `templates/packages/shared-types/src/schemas.ts` exists
- [ ] `extendZodWithOpenApi(z)` is called at the top of the file
- [ ] `ApiResponseSchema` is a generic function accepting a data schema parameter
- [ ] `ApiErrorResponseSchema` has success:false, error.code, error.message, error.fieldErrors (optional)
- [ ] `PaginationMetaSchema` has total, limit, cursor (optional), hasMore
- [ ] `PaginatedResultSchema` is a generic function accepting an item schema parameter
- [ ] All schemas include `.datetime()` for timestamp fields
- [ ] File uses ESM imports (`.js` extensions)

## Implementation Notes
- Use `z.literal(true)` and `z.literal(false)` for the `success` discriminator field
- `ApiResponseSchema` and `PaginatedResultSchema` are functions that take a `T extends z.ZodTypeAny` parameter
- The schemas should mirror the existing interfaces in `api.ts` exactly to maintain backward compatibility
- Import from `zod` and `@asteasolutions/zod-to-openapi`
- Reference the plan's Phase 1 code sample for exact structure

## Estimated Complexity
Medium -- Requires understanding Zod generics and aligning with existing type definitions

## Status
- [ ] Not Started
