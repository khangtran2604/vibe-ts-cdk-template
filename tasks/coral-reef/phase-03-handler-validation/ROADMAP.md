# Phase 3: Handler Validation Migration

## Overview
Replace manual validation logic in create and update handlers with Zod `safeParse()` calls. This applies to both the users service templates and the module generator templates. List, get, and delete handlers are unchanged since they only use path/query params.

## Prerequisites
Phase 2 complete -- Zod schemas must exist in both users service and module generator before handlers can import them.

## Tasks
| # | Task | Complexity | Dependencies | Status |
|---|------|-----------|--------------|--------|
| 3.1 | Migrate users create handler to Zod validation | Medium | 2.1 | ⬜ Not Started |
| 3.2 | Migrate users update handler to Zod validation | Medium | 2.1 | ⬜ Not Started |
| 3.3 | Migrate module create handler template to Zod | Medium | 2.2 | ⬜ Not Started |
| 3.4 | Migrate module update handler template to Zod | Medium | 2.2 | ⬜ Not Started |

## Phase Completion Criteria
- [ ] All create/update handlers use `Schema.safeParse()` instead of manual validation
- [ ] Validation errors return proper fieldErrors from Zod issues
- [ ] Error response format matches existing envelope structure (success:false, error.code, etc.)
- [ ] Handler behavior is functionally equivalent (same status codes, same response shapes)

## Progress: 0/4 tasks complete
