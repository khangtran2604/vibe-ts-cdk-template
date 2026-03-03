# Phase 3: Generator Engine

## Overview
Build the core module generation engine that copies templates, processes variable substitution, injects code into existing files, and optionally runs pnpm install. This is the heart of the `module` subcommand.

## Prerequisites
- Phase 1 complete (types, helpers, context detection, shared paths)
- Phase 2 complete (all template files exist)

## Tasks
| # | Task | Complexity | Dependencies | Status |
|---|------|-----------|--------------|--------|
| 3.1 | Create module-generator.ts | High | 1.2, 1.3, 1.4, 2.1, 2.2, 2.3 | ✅ Complete |
| 3.2 | Update pnpm-workspace.yaml builder | Low | 3.1 | ✅ Complete (no-op — `services/*` glob covers new modules) |

## Phase Completion Criteria
- [x] `generateModule(config)` successfully copies and transforms all template files
- [x] CDK stack is written to the correct location in `infra/src/stacks/modules/`
- [x] Import and instance injection into `infra/src/index.ts` works correctly
- [x] Route injection into `dev-gateway/src/gateway.ts` works correctly
- [x] Duplicate module name guard throws a clear error
- [x] pnpm-workspace.yaml is updated to include new service

## Progress: 2/2 tasks complete
