# Task: Implement git, pnpm, and logger utility functions

## ID
3.2

## Description
Create utility modules for git initialization, pnpm install execution, and logging via clack. These utilities wrap shell commands and provide consistent UI feedback during scaffolding.

## Dependencies
- Task 1.1: package.json for @clack/prompts dependency

## Inputs
- `ProjectConfig.gitInit` and `ProjectConfig.installDeps` flags
- Target directory path for git init and pnpm install

## Outputs / Deliverables
- `src/utils/git.ts` -- `initGit(dir)` function
- `src/utils/pnpm.ts` -- `installDeps(dir)` function
- `src/utils/logger.ts` -- Thin wrapper around `clack.log` methods

## Acceptance Criteria
- [ ] `initGit(dir)` runs `git init` in the specified directory and returns success/failure
- [ ] `installDeps(dir)` runs `pnpm install` in the specified directory and returns success/failure
- [ ] Both functions handle errors gracefully (non-zero exit codes, missing tools)
- [ ] Logger provides `info`, `success`, `warn`, `error` methods wrapping clack.log
- [ ] Shell commands use `child_process.execSync` or `execa` with proper error handling
- [ ] Both git and pnpm functions provide user-facing feedback via the logger

## Implementation Notes
- Use `child_process.execSync` with `{ cwd: dir, stdio: "pipe" }` to capture output and suppress noise
- Check if `git` and `pnpm` are available before running (graceful error message if not)
- The logger is a thin abstraction to keep clack usage consistent -- it should not add much complexity
- Consider using `clack.spinner()` for long-running operations like `pnpm install`

## Estimated Complexity
Low -- Simple shell command wrappers

## Status
- [ ] Not Started
