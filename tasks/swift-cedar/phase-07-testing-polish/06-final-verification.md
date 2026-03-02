# Task: Final end-to-end verification of all presets

## ID
7.6

## Description
Perform the final comprehensive verification of all three presets. Generate projects for minimal, standard, and full (with and without RDS), and verify each one builds, tests pass, and dev servers start. This is the release-readiness checkpoint.

## Dependencies
- Task 7.1: Scaffolder tests passing
- Task 7.2: Presets tests passing
- Task 7.3: Template helpers tests passing
- Task 7.4: FS utils tests passing
- Task 7.5: Error handling polished

## Inputs
- Built CLI
- All three presets
- Full verification commands from PLAN.md

## Outputs / Deliverables
- Verified CLI ready for use
- All `pnpm test` passing for the CLI itself
- All three preset variants generating working projects

## Acceptance Criteria
- [ ] `pnpm test` passes for the CLI project (all test files)
- [ ] `pnpm build && node dist/index.js --preset minimal -y` -> project builds and tests pass
- [ ] `pnpm build && node dist/index.js --preset standard -y` -> project builds and tests pass
- [ ] `pnpm build && node dist/index.js --preset full -y` -> project builds and tests pass
- [ ] `pnpm build && node dist/index.js --preset full --rds -y` -> project builds and tests pass
- [ ] Interactive mode works correctly (manual test)
- [ ] Non-interactive mode with all flag combinations works
- [ ] No TypeScript errors in CLI codebase (`tsc --noEmit`)
- [ ] Generated projects have no leftover template artifacts

## Implementation Notes
- This is the final quality gate before the CLI is considered complete
- Run all verifications in clean temp directories
- Test on a clean environment if possible (no cached node_modules)
- Document any known limitations or edge cases in comments

## Estimated Complexity
Medium -- Comprehensive but methodical verification

## Status
- [ ] Not Started
