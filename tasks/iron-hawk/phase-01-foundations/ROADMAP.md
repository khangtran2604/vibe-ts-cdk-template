# Phase 1: Foundations

## Overview
Establish the type definitions, string utilities, project context detection, and shared path utilities that the module generator depends on. These are the building blocks that all subsequent phases consume.

## Prerequisites
None -- this is the first phase.

## Tasks
| # | Task | Complexity | Dependencies | Status |
|---|------|-----------|--------------|--------|
| 1.1 | Add ModuleConfig type | Low | None | ✅ Complete |
| 1.2 | Create module-helpers.ts | Medium | 1.1 | ✅ Complete |
| 1.3 | Create module-context.ts | Medium | 1.1 | ✅ Complete |
| 1.4 | Extract resolveTemplateRoot to shared util | Low | None | ✅ Complete |

## Phase Completion Criteria
- [x] ModuleConfig interface exported from types.ts
- [x] All string transform functions implemented and correct
- [x] injectBeforeMarker utility implemented
- [x] detectProjectContext correctly identifies scaffolded projects
- [x] scanNextPort correctly detects next available port
- [x] resolveTemplateRoot moved to shared location, scaffolder.ts updated to import from there

## Progress: 4/4 tasks complete
