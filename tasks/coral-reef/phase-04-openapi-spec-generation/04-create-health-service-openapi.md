# Task: Create health service OpenAPI registration

## ID
4.4

## Description
Create the OpenAPI route registration for the health service. This is the simplest service -- it only has a single `GET /health` endpoint with a fixed response schema. No request body validation is needed.

## Dependencies
- Task 1.1: Shared-types envelope schemas for the response wrapper

## Inputs
- Existing health handler at `templates/services/health/src/handlers/health.ts`
- Shared-types envelope schemas

## Outputs / Deliverables
- `templates/services/health/src/openapi.ts`

## Acceptance Criteria
- [ ] Creates and exports an `OpenAPIRegistry`
- [ ] Registers `GET /health` endpoint
- [ ] Response schema reflects the actual health check response (status, timestamp, etc.)
- [ ] Uses `ApiResponseSchema` wrapper from shared-types
- [ ] No request body schemas needed

## Implementation Notes
- Check the existing health handler to see what the response shape actually is
- The health response likely includes `{ status: "ok", timestamp: "..." }` or similar
- Define a simple inline Zod schema for the health response data
- This is the simplest OpenAPI registration -- good starting point if needed

## Estimated Complexity
Low -- Single endpoint with simple response

## Status
- [ ] Not Started
