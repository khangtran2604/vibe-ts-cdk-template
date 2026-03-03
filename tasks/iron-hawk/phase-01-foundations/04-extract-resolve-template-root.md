# Task: Extract resolveTemplateRoot to Shared Util

## ID
1.4

## Description
Extract the `resolveTemplateRoot()` function from `src/scaffolder.ts` into a shared utility location (e.g., `src/utils/paths.ts`) so that both the existing scaffolder and the new module generator can resolve the templates directory. Update `scaffolder.ts` to import from the new location.

## Dependencies
None

## Inputs
- Existing `src/scaffolder.ts` containing `resolveTemplateRoot()` or equivalent logic
- Template resolution convention: `path.resolve(__dirname, "..", "templates")`

## Outputs / Deliverables
- New file `src/utils/paths.ts` (or added to existing utils file) with exported `resolveTemplateRoot()` function
- Updated `src/scaffolder.ts` importing from the shared location instead of defining it locally

## Acceptance Criteria
- [ ] `resolveTemplateRoot()` is exported from a shared utils file
- [ ] `src/scaffolder.ts` imports `resolveTemplateRoot` from the shared location
- [ ] The scaffolder's behavior is unchanged (existing tests pass)
- [ ] Build succeeds (`pnpm build`)
- [ ] Existing tests pass (`pnpm test`)

## Implementation Notes
- Check how `resolveTemplateRoot` is currently implemented in `scaffolder.ts`. It likely uses `path.resolve(__dirname, "..", "templates")` per CLAUDE.md's convention.
- If `src/utils/` already has a file that would logically hold path utilities, add there. Otherwise create `src/utils/paths.ts`.
- This is a pure refactor -- no behavior change, just moving code to enable sharing.

## Estimated Complexity
Low -- Simple extract-and-import refactor.

## Status
- [ ] Not Started
