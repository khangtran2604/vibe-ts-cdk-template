# Task: Update Module app.ts Template with Auth Placeholders

## ID
2.2

## Description
Modify the module generator's `app.ts.hbs` template to include `{{localAuthImport}}`, `{{localAuthConst}}`, and per-route `{{xxxAuthMiddleware}}` placeholders so that generated service app files conditionally include local auth middleware.

## Dependencies
- Task 2.1: The variable map must define the placeholder values before the template can use them

## Inputs
- `templates/generators/module/src/app.ts.hbs` (existing template file)

## Outputs / Deliverables
- Modified `templates/generators/module/src/app.ts.hbs`

## Acceptance Criteria
- [ ] `{{localAuthImport}}` placeholder added after other imports
- [ ] `{{localAuthConst}}` placeholder added before route definitions
- [ ] Each route line includes its corresponding `{{xxxAuthMiddleware}}` placeholder before `lambdaToHono(...)`
- [ ] When all auth variables resolve to empty string, the generated file looks identical to current output (no extra blank lines or spaces)
- [ ] When auth variables are populated, the generated file has proper import, const, and inline middleware

## Implementation Notes
- Hono supports variadic handlers: `app.get("/path", middleware1, middleware2, handler)`. The auth middleware is inserted as an additional argument before the `lambdaToHono(...)` call.
- The `{{xxxAuthMiddleware}}` values include a trailing comma-space (`"auth, "`) when active, so they can be placed directly before `lambdaToHono(...)`.

## Estimated Complexity
Low -- Template placeholder insertion following established patterns.

## Status
- [ ] Not Started
