# Task: Update lambdaToHono Adapter to Read authorizerClaims

## ID
1.2

## Description
Modify the `lambdaToHono` adapter in `templates/packages/lambda-utils/src/lambda-adapter.ts` to read `authorizerClaims` from the Hono context and populate `requestContext.authorizer`. This connects the upstream `localAuth` middleware to the Lambda event structure that handlers consume.

## Dependencies
- Task 1.1: The `localAuth` middleware must exist so the `authorizerClaims` context key is defined

## Inputs
- `templates/packages/lambda-utils/src/lambda-adapter.ts` (existing file, line ~83 with `authorizer: {}`)

## Outputs / Deliverables
- Modified `templates/packages/lambda-utils/src/lambda-adapter.ts`

## Acceptance Criteria
- [ ] `authorizer: {}` changed to `authorizer: c.get("authorizerClaims") ?? {}`
- [ ] Unprotected routes (no middleware) still get `authorizer: {}` (the `?? {}` fallback)
- [ ] Protected routes get `authorizer: { sub, username, email }` when valid token provided
- [ ] No other changes to the adapter

## Implementation Notes
- This is a single-line change. The `??` operator ensures backward compatibility: when `localAuth` middleware hasn't run (unprotected routes), `c.get("authorizerClaims")` returns `undefined`, falling back to `{}`.

## Estimated Complexity
Low -- Single line change.

## Status
- [x] Complete
