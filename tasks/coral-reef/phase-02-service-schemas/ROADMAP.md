# Phase 2: Service Schemas

## Overview
Create Zod schemas for the users service (built-in template) and the module generator template. These define entity-specific schemas (User, CreateUserBody, etc.) and derive TypeScript types from them, replacing manually written interfaces.

## Prerequisites
Phase 1 complete -- shared-types schemas and dependencies must be in place.

## Tasks
| # | Task | Complexity | Dependencies | Status |
|---|------|-----------|--------------|--------|
| 2.1 | Create users service Zod schemas | Medium | 1.1 | ⬜ Not Started |
| 2.2 | Create module generator Zod schema template | Medium | 1.1 | ⬜ Not Started |
| 2.3 | Migrate types to re-export from schemas | Low | 2.1, 2.2 | ⬜ Not Started |

## Phase Completion Criteria
- [ ] Users service has `src/schemas/index.ts` with User, CreateUserBody, UpdateUserBody schemas
- [ ] Module generator has `src/schemas/index.ts.hbs` with templated entity schemas
- [ ] Both services' `types/index.ts` files re-export types from schemas (preserving existing import paths)

## Progress: 0/3 tasks complete
