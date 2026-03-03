# Task: Update pnpm-workspace.yaml Builder

## ID
3.2

## Description
Ensure that after a module is generated, the new `services/<moduleName>` directory is added to the `pnpm-workspace.yaml` file in the scaffolded project. Since `pnpm-workspace.yaml` is built programmatically (per CLAUDE.md), the module generator needs to either append to the existing file or the workspace already uses a glob pattern like `services/*`.

## Dependencies
- Task 3.1: This is part of the generator flow; needs to understand what the generator does

## Inputs
- Existing `pnpm-workspace.yaml` structure in scaffolded projects
- How the scaffolder currently builds `pnpm-workspace.yaml` (in `src/scaffolder.ts`)

## Outputs / Deliverables
- Logic in `module-generator.ts` (or a utility) to update `pnpm-workspace.yaml` with the new service entry
- OR verification that existing glob patterns already cover new services (in which case, document this finding and no code change is needed)

## Acceptance Criteria
- [ ] After module generation, `pnpm install` correctly discovers the new service package
- [ ] The workspace configuration includes the new `services/<moduleName>` path
- [ ] No duplicate entries are added if the service path is already covered by a glob
- [ ] Build succeeds (`pnpm build`)

## Implementation Notes
- First, check how the scaffolder builds `pnpm-workspace.yaml`. If it already uses `"services/*"` as a glob pattern, then new services are automatically discovered and this task is essentially a no-op verification.
- If the workspace file lists services explicitly (e.g., `"services/health"`, `"services/users"`), then the module generator needs to append `"services/<moduleName>"` to the packages list.
- To append to YAML without a YAML parser, read the file as text, find the packages array, and add the new entry. Keep it simple.

## Estimated Complexity
Low -- Likely a simple append or a no-op if globs are already used.

## Status
- [ ] Not Started
