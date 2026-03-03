# Phase 5 Summary: Swagger UI Gateway

## Completed On
2026-03-03

## What Was Built
- Modified `templates/dev-gateway/src/gateway.ts` — added `/docs/openapi.json` and `/docs` endpoints
- `test/swagger-ui-gateway.test.ts` — 43 tests covering all new gateway functionality

## Key APIs (for downstream tasks)
- `GET /docs/openapi.json` — returns merged OpenAPI 3.1 spec from all services (aggregated at request time)
- `GET /docs` — serves Swagger UI HTML page loading spec from `/docs/openapi.json`
- `getMergedOpenApiSpec()` — internal helper that scans `../services/*/dist/openapi.json` and merges paths + schemas

## Patterns Established
- Two-pass schema merge: first pass counts schema name occurrences across services, second pass prefixes only conflicting names with service directory name (e.g., `users_User`)
- `$ref` rewriting: when schemas are renamed, all `$ref` pointers in both paths and schema definitions are updated via JSON round-trip + `replaceAll`
- Documentation endpoints placed before proxy logic in gateway `handleRequest` — they don't require running services
- Swagger UI loaded from CDN (`unpkg.com/swagger-ui-dist@5`) — no npm dependency needed

## Decisions Made
- Schema conflict resolution only prefixes duplicates (not all schemas) — keeps names clean when no conflicts exist
- `$ref` rewriting happens per-service before merging into shared object — prevents cross-service interference
- Spec regenerated on each request (no caching) — simplest approach for dev tool, acceptable for small number of services
- Root package.json `name` and `version` used for merged spec `info` fields

## Dependencies Added
None — Swagger UI loaded from CDN, all Node.js built-ins (`fs`, `path`) already available

## Known Limitations
- CDN URLs use `@5` range tag (not pinned to exact version) — acceptable for dev-only tool
- `/docs` exact-match only (no trailing slash or query string handling)
- Spec not cached — rebuilt from disk on each request to `/docs/openapi.json`
