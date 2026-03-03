# Task: Polish error handling and UX

## ID
7.5

## Description
Review and improve error handling throughout the CLI, enhance user-facing messages, and ensure a polished user experience. This includes graceful error messages, helpful diagnostics, and consistent styling via clack.

## Dependencies
- Task 6.5: Full preset verified (all functionality exists to polish)

## Inputs
- All CLI source files
- Edge cases discovered during verification tasks

## Outputs / Deliverables
- Updated error handling across all CLI modules
- Improved user-facing messages and progress indicators

## Acceptance Criteria
- [ ] Missing `pnpm` binary shows helpful error message suggesting installation
- [ ] Missing `git` binary shows helpful error message (not a crash)
- [ ] Target directory already exists: clear error with suggestion
- [ ] Invalid project name: clear validation message with allowed format
- [ ] Network errors during `pnpm install`: caught with helpful message
- [ ] All clack spinners show clear progress for each scaffold step
- [ ] "Done! Next steps" message is accurate for the selected preset
- [ ] CLI banner displays version correctly
- [ ] Ctrl+C at any point exits cleanly without stack traces

## Implementation Notes
- Review each `try/catch` block for user-friendly messages
- Ensure spinners are stopped (success or fail) in all code paths
- Test edge cases: run from read-only directory, run with no disk space
- Consider adding `--verbose` flag for debugging (shows full error stacks)
- Check that clack.outro is always called on exit (normal or error)

## Estimated Complexity
Medium -- Cross-cutting review and improvement

## Status
- [x] Complete
