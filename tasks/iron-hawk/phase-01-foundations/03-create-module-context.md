# Task: Create module-context.ts

## ID
1.3

## Description
Create `src/module-context.ts` with functions to detect whether the current directory is a valid scaffolded project, read the project name from `package.json`, and scan for the next available service port. This provides the runtime context the module generator needs.

## Dependencies
- Task 1.1: Needs `ModuleConfig` type definition

## Inputs
- `ModuleConfig` interface from `src/types.ts`
- Knowledge of scaffolded project structure: `infra/`, `services/`, `dev-gateway/`, `pnpm-workspace.yaml`
- Port convention: health=3001, users=3002, next module=3003, etc.

## Outputs / Deliverables
- New file `src/module-context.ts` with exported functions

## Acceptance Criteria
- [ ] `detectProjectContext(projectDir)` verifies the directory contains `infra/`, `services/`, `dev-gateway/`, and `pnpm-workspace.yaml`
- [ ] `detectProjectContext` throws a clear error if any expected directory/file is missing
- [ ] `readProjectName(projectDir)` reads and returns the `name` field from the root `package.json`
- [ ] `readProjectName` throws a clear error if `package.json` is missing or has no `name`
- [ ] `scanNextPort(projectDir)` scans `services/*/src/dev-server.ts` files for `PORT =` patterns and returns max + 1
- [ ] `scanNextPort` returns 3001 as default if no services exist (edge case)
- [ ] All functions use async fs operations (not sync)
- [ ] Build succeeds (`pnpm build`)

## Implementation Notes
- Port scanning: Use `fs.readdir` on `services/`, then for each subdirectory read `src/dev-server.ts` and regex-match for something like `const PORT = (\d+)` or `port:\s*(\d+)`. Take the maximum found port and add 1.
- Project detection should check for the presence of key directories/files that the scaffolder creates. This is a heuristic -- it does not need to be perfect, just good enough to prevent running the module generator in a random directory.
- Consider using the existing `src/utils/fs.ts` helpers if they provide useful abstractions.

## Estimated Complexity
Medium -- File system scanning with port parsing and validation logic.

## Status
- [ ] Not Started
