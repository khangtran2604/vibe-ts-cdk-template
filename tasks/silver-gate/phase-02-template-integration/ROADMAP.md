# Phase 2: Template Integration

## Overview
Wire the `localAuth` middleware into the module generator pipeline by adding template variables to the CLI source and auth placeholders to the app.ts template. After this phase, `node dist/index.js module orders --protected -y` generates an `app.ts` with inline auth middleware on each protected route.

## Prerequisites
Phase 1 complete -- the middleware and its export must exist in the lambda-utils template.

## Tasks
| # | Task | Complexity | Dependencies | Status |
|---|------|-----------|--------------|--------|
| 2.1 | Add auth template variables to module helpers | Medium | None | ✅ Complete |
| 2.2 | Update module app.ts template with auth placeholders | Low | 2.1 | ✅ Complete |

## Phase Completion Criteria
- [x] `getModuleVariableMap()` returns all 7 new auth variables
- [x] `app.ts.hbs` template includes all auth placeholders
- [x] Protected module generation produces correct auth middleware in output
- [x] Unprotected module generation produces clean output with no auth artifacts

## Progress: 2/2 tasks complete ✅
