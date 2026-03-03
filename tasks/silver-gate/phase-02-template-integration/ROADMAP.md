# Phase 2: Template Integration

## Overview
Wire the `localAuth` middleware into the module generator pipeline by adding template variables to the CLI source and auth placeholders to the app.ts template. After this phase, `node dist/index.js module orders --protected -y` generates an `app.ts` with inline auth middleware on each protected route.

## Prerequisites
Phase 1 complete -- the middleware and its export must exist in the lambda-utils template.

## Tasks
| # | Task | Complexity | Dependencies | Status |
|---|------|-----------|--------------|--------|
| 2.1 | Add auth template variables to module helpers | Medium | None | :white_large_square: Not Started |
| 2.2 | Update module app.ts template with auth placeholders | Low | 2.1 | :white_large_square: Not Started |

## Phase Completion Criteria
- [ ] `getModuleVariableMap()` returns all 7 new auth variables
- [ ] `app.ts.hbs` template includes all auth placeholders
- [ ] Protected module generation produces correct auth middleware in output
- [ ] Unprotected module generation produces clean output with no auth artifacts

## Progress: 0/2 tasks complete
