# Task: Add detectAuthSupport() to module-context.ts

## ID
1.2

## Description
Add a new exported function `detectAuthSupport()` to `src/module-context.ts` that checks whether the target project has an `auth/` directory. This function is used to validate that `--protected` can only be used on projects that include auth infrastructure (standard+ presets).

## Dependencies
None

## Inputs
- Existing `src/module-context.ts` with project context detection utilities
- Existing `pathExists` utility (or equivalent fs check already used in the file)

## Outputs / Deliverables
- Updated `src/module-context.ts` with exported `detectAuthSupport()` function

## Acceptance Criteria
- [ ] `detectAuthSupport(projectDir: string): Promise<boolean>` is exported
- [ ] Returns `true` when `auth/` directory exists in `projectDir`
- [ ] Returns `false` when `auth/` directory does not exist
- [ ] Uses the same fs utilities already used elsewhere in the file (e.g., `pathExists` or `fs.access`)
- [ ] `pnpm build` passes without errors

## Implementation Notes
Check the existing imports in `module-context.ts` to see which fs utility is already used (likely `pathExists` from `utils/` or Node's `fs.access`). Reuse that pattern.

```typescript
export async function detectAuthSupport(projectDir: string): Promise<boolean> {
  return pathExists(join(projectDir, "auth"));
}
```

## Estimated Complexity
Low -- Single function, a few lines.

## Status
- [ ] Not Started
