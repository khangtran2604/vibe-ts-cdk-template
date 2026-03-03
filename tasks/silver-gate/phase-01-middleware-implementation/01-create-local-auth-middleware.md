# Task: Create localAuth Hono Middleware

## ID
1.1

## Description
Create the `localAuth()` Hono middleware in `templates/packages/lambda-utils/src/middleware/local-auth.ts`. This middleware enforces authentication on protected endpoints during local development by decoding JWTs (without cryptographic verification) and returning production-matching status codes and response bodies.

## Dependencies
None

## Inputs
- Production behavior reference from the plan (status codes, response body formats)
- Existing `templates/auth/src/authorizer.ts` for claims structure (sub, username, email)
- Existing middleware pattern from `templates/packages/lambda-utils/src/middleware/error-handler.ts`

## Outputs / Deliverables
- `templates/packages/lambda-utils/src/middleware/local-auth.ts`

## Acceptance Criteria
- [ ] Middleware exported as `localAuth` function that returns a Hono `MiddlewareHandler`
- [ ] No `Authorization` header returns `401` with `{"message": "Unauthorized"}`
- [ ] Non-Bearer format returns `403` with `{"message": "User is not authorized to access this resource with an explicit deny"}`
- [ ] Invalid JWT structure (not 3 dot-separated parts) returns `403`
- [ ] Missing `sub` claim in decoded payload returns `403`
- [ ] Valid JWT sets `authorizerClaims` on context with `{ sub, username, email }` matching production authorizer shape
- [ ] `username` falls back to `sub` when not present in token
- [ ] `email` is only included when present in token
- [ ] All claim values are coerced to strings (matching API Gateway behavior)
- [ ] JWT decode uses base64url decoding (handles both standard and url-safe base64)
- [ ] Zero dependencies beyond Hono types (no crypto libraries)

## Implementation Notes
- The JWT decode function should: split on `.`, expect 3 parts, base64url-decode the middle part, JSON.parse, validate it's an object with a string `sub` field.
- Return `null` on any decode failure to trigger the 403 path.
- Use `c.set("authorizerClaims", ...)` to pass claims downstream (consumed by `lambdaToHono` adapter).
- Follow the same export pattern as `error-handler.ts` in the same middleware directory.

## Estimated Complexity
Medium -- Core logic with multiple code paths and production behavior matching.

## Status
- [x] Complete
