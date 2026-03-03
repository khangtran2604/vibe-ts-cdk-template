# Task: Create users service OpenAPI route registration

## ID
4.1

## Description
Create the OpenAPI route registration file for the users service. This uses `@asteasolutions/zod-to-openapi`'s `OpenAPIRegistry` to define all 5 CRUD endpoints (list, create, get, update, delete) with their request/response schemas. The registry is the input for build-time spec generation.

## Dependencies
- Task 2.1: Users service Zod schemas must exist for referencing in route definitions

## Inputs
- `templates/services/users/src/schemas/index.ts` (entity schemas)
- `templates/packages/shared-types/src/schemas.ts` (envelope schemas)
- Existing handler files to understand the exact request/response shapes

## Outputs / Deliverables
- `templates/services/users/src/openapi.ts`

## Acceptance Criteria
- [ ] File creates an `OpenAPIRegistry` instance and exports it
- [ ] Registers all entity schemas (User, CreateUserBody, UpdateUserBody)
- [ ] Registers POST /users endpoint with CreateUserBody request body and 201/400 responses
- [ ] Registers GET /users endpoint with pagination query params and paginated response
- [ ] Registers GET /users/{id} endpoint with 200/404 responses
- [ ] Registers PUT /users/{id} endpoint with UpdateUserBody request body and 200/400/404 responses
- [ ] Registers DELETE /users/{id} endpoint with 200/404 responses
- [ ] All responses use the proper envelope schemas (ApiResponseSchema, ApiErrorResponseSchema)
- [ ] Path parameters use `z.string().uuid()` for id

## Implementation Notes
- Import `OpenAPIRegistry` from `@asteasolutions/zod-to-openapi`
- Import entity schemas from local `./schemas/index.js`
- Import envelope schemas from the shared-types package: `@{{projectName}}/shared-types/schemas` -- note this may need a `.hbs` extension or template variable depending on how the project name is referenced
- Each `registerPath()` call defines method, path, summary, request, and responses
- For list endpoint: define query parameters for `cursor` and `limit` using Zod schemas
- Reference the plan's Phase 5 code sample

## Estimated Complexity
High -- 5 endpoints with detailed request/response schemas require careful definition

## Status
- [ ] Not Started
