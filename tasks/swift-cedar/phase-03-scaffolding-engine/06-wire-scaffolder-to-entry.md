# Task: Wire scaffolder into CLI entry point

## ID
3.6

## Description
Update `src/index.ts` to call the `scaffold()` function after prompts are complete. Replace the temporary config logging with the actual scaffolding execution. Add the "Done! Next steps" outro message.

## Dependencies
- Task 2.3: Entry point must have prompts wired in
- Task 3.4: scaffolder.ts must be implemented

## Inputs
- `scaffold()` function from scaffolder.ts
- `ProjectConfig` from prompt resolution
- Next steps messaging from PLAN.md CLI Interactive Flow

## Outputs / Deliverables
- Updated `src/index.ts` with full prompt-to-scaffold pipeline

## Acceptance Criteria
- [ ] Running CLI with any preset triggers scaffolding after prompts complete
- [ ] Progress is displayed for each scaffolding step via clack spinner
- [ ] "Done! Next steps" outro message shows `cd <project>`, `pnpm dev`, `pnpm cdk deploy --all`
- [ ] Errors during scaffolding are caught and displayed with `clack.log.error`
- [ ] The CLI exits with code 0 on success, non-zero on failure
- [ ] `pnpm build && node dist/index.js --preset minimal -y` produces a directory with base files

## Implementation Notes
- Wrap the scaffold call in a try/catch for user-friendly error reporting
- The outro message should be contextual (e.g., skip "pnpm dev" suggestion if --no-install was used)
- This is the final integration point for Phase 3 -- test the full loop after completion

## Estimated Complexity
Low -- Integration wiring with error handling

## Status
- [x] Complete
