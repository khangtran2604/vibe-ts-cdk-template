# Task: Add Swagger UI HTML endpoint

## ID
5.2

## Description
Add a `GET /docs` handler to the dev-gateway that serves a minimal HTML page loading Swagger UI from CDN. The page points at `/docs/openapi.json` to load the merged spec.

## Dependencies
- Task 5.1: The `/docs/openapi.json` endpoint must exist for Swagger UI to load

## Inputs
- `templates/dev-gateway/src/gateway.ts` (already modified in 5.1)

## Outputs / Deliverables
- Modified `templates/dev-gateway/src/gateway.ts` with `/docs` handler

## Acceptance Criteria
- [ ] `GET /docs` returns HTML with `Content-Type: text/html`
- [ ] HTML loads Swagger UI CSS and JS from `unpkg.com/swagger-ui-dist@5`
- [ ] Swagger UI is initialized with `url: "/docs/openapi.json"`
- [ ] Page has a reasonable title (e.g., "API Documentation")
- [ ] Handler is placed before proxy logic in the gateway
- [ ] No npm dependency needed for Swagger UI (CDN only)

## Implementation Notes
- Use a template literal for the HTML string
- Swagger UI CDN URLs:
  - CSS: `https://unpkg.com/swagger-ui-dist@5/swagger-ui.css`
  - JS: `https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js`
- Minimal HTML structure: `<div id="swagger-ui">`, then `SwaggerUIBundle({ url: "/docs/openapi.json", dom_id: "#swagger-ui" })`
- This can be implemented in the same modification as task 5.1 since both modify the same file

## Estimated Complexity
Low -- Static HTML response with CDN links

## Status
- [ ] Not Started
