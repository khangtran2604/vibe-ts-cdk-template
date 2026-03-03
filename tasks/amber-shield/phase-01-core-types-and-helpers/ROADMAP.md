# Phase 1: Core Types and Helpers

## Overview
Establish the foundational types, context detection, and variable generation logic needed for the `--protected` flag. These changes are internal and do not yet surface in the CLI or templates.

## Prerequisites
None -- this is the first phase.

## Tasks
| # | Task | Complexity | Dependencies | Status |
|---|------|-----------|--------------|--------|
| 1.1 | Add ProtectedEndpoints type and extend ModuleConfig | Low | None | ✅ Complete |
| 1.2 | Add detectAuthSupport() to module-context.ts | Low | None | ✅ Complete |
| 1.3 | Add auth variables to getModuleVariableMap() | Medium | 1.1 | ✅ Complete |

## Phase Completion Criteria
- [x] `ProtectedEndpoints` type exists and is exported
- [x] `ModuleConfig` has optional `protectedEndpoints` field
- [x] `detectAuthSupport()` correctly detects `auth/` directory presence
- [x] Variable map produces correct auth variables for both protected and unprotected cases
- [x] `pnpm build` passes

## Progress: 3/3 tasks complete
