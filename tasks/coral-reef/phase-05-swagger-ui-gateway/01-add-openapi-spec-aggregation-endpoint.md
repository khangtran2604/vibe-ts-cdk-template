# Task: Add OpenAPI spec aggregation endpoint

## ID
5.1

## Description
Add a `GET /docs/openapi.json` handler to the dev-gateway that reads `dist/openapi.json` from each service directory, merges all paths and component schemas into a single unified OpenAPI 3.1 document, and returns it as JSON. This is the core of the API documentation feature.

## Dependencies
- Task 4.3: Spec generation scripts must exist so services produce `dist/openapi.json`
- Task 4.5: Service package.json must have build scripts that generate specs

## Inputs
- `templates/dev-gateway/src/gateway.ts` (existing gateway file)
- Service directory structure: `../services/*/dist/openapi.json`

## Outputs / Deliverables
- Modified `templates/dev-gateway/src/gateway.ts` with `/docs/openapi.json` handler

## Acceptance Criteria
- [ ] Handler is placed BEFORE the proxy logic in the gateway (so it is matched first)
- [ ] Scans `../services/*/dist/openapi.json` using `fs.readdirSync` + `fs.existsSync`
- [ ] Merges all `paths` objects into a single paths map
- [ ] Merges all `components.schemas` objects into a single schemas map
- [ ] Handles schema name conflicts by prefixing with service name if duplicates exist
- [ ] Sets top-level `info.title` from project name and `info.version` from root package.json
- [ ] Returns `Content-Type: application/json`
- [ ] Gracefully handles missing spec files (services that have not been built yet)
- [ ] OpenAPI version set to "3.1.0"

## Implementation Notes
- Use `fs.readdirSync` to list directories under `../services/`
- For each directory, check if `dist/openapi.json` exists with `fs.existsSync`
- Parse each spec with `JSON.parse(fs.readFileSync(...))`
- Merge strategy: spread all `paths` objects together, spread all `components.schemas` objects together
- For duplicate schema names: prefix with service directory name (e.g., `users_User` vs `orders_Order`)
- The path to services is relative to the dev-gateway: `path.resolve(__dirname, "../../services")`
- Consider caching the merged spec (or regenerating on each request for dev simplicity)

## Estimated Complexity
High -- Spec merging with conflict handling requires careful implementation

## Status
- [ ] Not Started
