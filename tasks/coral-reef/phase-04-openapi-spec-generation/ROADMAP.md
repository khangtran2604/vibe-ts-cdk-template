# Phase 4: OpenAPI Spec Generation

## Overview
Create OpenAPI route registrations and build-time spec generation scripts for all services (users, health) and the module generator template. Each service generates its own `dist/openapi.json` at build time. Package.json files are updated with the necessary dependencies and scripts.

## Prerequisites
Phase 2 complete -- Zod schemas must exist for route registration to reference them. Phase 3 is NOT required for this phase (they can proceed in parallel).

## Tasks
| # | Task | Complexity | Dependencies | Status |
|---|------|-----------|--------------|--------|
| 4.1 | Create users service OpenAPI route registration | High | 2.1 | ✅ Complete |
| 4.2 | Create module generator OpenAPI template | High | 2.2 | ✅ Complete |
| 4.3 | Create spec generation scripts | Medium | 4.1, 4.2 | ✅ Complete |
| 4.4 | Create health service OpenAPI registration | Low | 1.1 | ✅ Complete |
| 4.5 | Update service package.json templates | Medium | 4.1, 4.2, 4.4 | ✅ Complete |

## Phase Completion Criteria
- [x] Users service has `openapi.ts` with all 5 CRUD endpoints registered
- [x] Module generator has `openapi.ts.hbs` with templated CRUD endpoints
- [x] Health service has `openapi.ts` with GET /health endpoint
- [x] All services have `generate-spec.ts` scripts that produce `dist/openapi.json`
- [x] All service `package.json.hbs` files include zod deps and generate:openapi scripts
- [x] Build scripts chain spec generation after tsc

## Progress: 5/5 tasks complete
