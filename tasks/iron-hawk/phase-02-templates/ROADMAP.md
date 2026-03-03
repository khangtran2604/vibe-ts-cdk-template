# Phase 2: Generator Templates

## Overview
Create the template files that the module generator will copy and transform when generating a new CRUD service. This includes the service module templates, the CDK infrastructure stack template, and adding injection marker comments to existing scaffolding templates.

## Prerequisites
Phase 1 design decisions are finalized (variable naming conventions from Task 1.2's `getModuleVariableMap`).

## Tasks
| # | Task | Complexity | Dependencies | Status |
|---|------|-----------|--------------|--------|
| 2.1 | Add marker comments to existing templates | Low | None | ✅ Complete |
| 2.2 | Create CRUD service module templates | High | 1.2 | ✅ Complete |
| 2.3 | Create CDK infrastructure stack template | Medium | 1.2 | ✅ Complete |

## Phase Completion Criteria
- [x] Existing `templates/infra/src/index.ts.hbs` has import and instance injection markers
- [x] Existing `templates/dev-gateway/src/gateway.ts` has route injection marker
- [x] `templates/generators/module/` contains all 16 template files for a complete CRUD service
- [x] `templates/generators/infra-stack/stack.ts.hbs` contains a valid CDK stack template
- [x] All templates use correct `{{variable}}` placeholders matching the variable map from Task 1.2
- [x] Existing scaffolding still works correctly after marker additions (839 tests pass)

## Progress: 3/3 tasks complete
