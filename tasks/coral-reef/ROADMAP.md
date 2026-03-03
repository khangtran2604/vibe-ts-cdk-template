# Project Roadmap: Automatic OpenAPI 3.1 Documentation Generation

## Generated From
/Users/khang.tm/.claude/plans/partitioned-weaving-shannon.md

## Generated On
2026-03-03

## Phases Overview
| Phase | Title | Tasks | Completed | Status |
|-------|-------|-------|-----------|--------|
| 1 | Zod Schemas Foundation | 3 | 3 | ✅ Complete |
| 2 | Service Schemas | 3 | 3 | ✅ Complete |
| 3 | Handler Validation Migration | 4 | 4 | ✅ Complete |
| 4 | OpenAPI Spec Generation | 5 | 5 | ✅ Complete |
| 5 | Swagger UI Gateway | 2 | 2 | ✅ Complete |
| 6 | Testing and Documentation | 3 | 0 | ⬜ Not Started |

## Dependency Graph Summary
The critical path flows through: shared-types schemas (1.1) -> users service schemas (2.1) -> handler migration (3.1/3.2) -> OpenAPI route registration (4.1) -> spec generation script (4.3) -> dev-gateway docs endpoint (5.1) -> integration tests (6.2).

Parallel work is possible within phases: module generator schemas (2.2) can proceed alongside users schemas (2.1) once shared-types (1.1) is done. Health service OpenAPI (4.4) is independent of users OpenAPI (4.1). Module generator handlers (3.3/3.4) parallelize with users handlers (3.1/3.2).

## Quick Stats
- **Total Phases**: 6
- **Total Tasks**: 20
- **Critical Path**: 1.1 -> 1.2 -> 2.1 -> 3.1 -> 4.1 -> 4.3 -> 4.5 -> 5.1 -> 5.2 -> 6.2

## How to Use This Task Breakdown
1. Start with Phase 1 tasks that have no dependencies
2. Check task dependencies before starting any task
3. Update task status in both the task file and phase ROADMAP.md
4. Update this top-level ROADMAP.md when phases complete
