# Phase 5: Swagger UI Gateway

## Overview
Add the `/docs` and `/docs/openapi.json` endpoints to the dev-gateway. The gateway aggregates OpenAPI specs from all services into a unified document and serves Swagger UI from CDN for interactive API exploration.

## Prerequisites
Phase 4 complete -- services must have OpenAPI spec generation in place so the gateway has specs to aggregate.

## Tasks
| # | Task | Complexity | Dependencies | Status |
|---|------|-----------|--------------|--------|
| 5.1 | Add OpenAPI spec aggregation endpoint | High | 4.3, 4.5 | ✅ Complete |
| 5.2 | Add Swagger UI HTML endpoint | Low | 5.1 | ✅ Complete |

## Phase Completion Criteria
- [x] `GET /docs/openapi.json` returns a merged OpenAPI 3.1 spec from all services
- [x] `GET /docs` serves Swagger UI HTML that loads the merged spec
- [x] Schema name conflicts between services are handled (prefixed with service name)
- [x] Swagger UI loads from CDN (unpkg.com/swagger-ui-dist@5)

## Progress: 2/2 tasks complete
