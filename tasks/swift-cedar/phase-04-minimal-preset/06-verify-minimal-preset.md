# Task: Verify minimal preset end-to-end

## ID
4.6

## Description
Run the full verification loop for the minimal preset: build the CLI, generate a project, install dependencies, run dev servers, and run tests. Fix any issues discovered during verification. This is the integration testing checkpoint for the minimal preset.

## Dependencies
- Task 3.6: Scaffolder wired into entry point
- Task 4.1: Infra templates
- Task 4.2: Health service template
- Task 4.3: Users service template
- Task 4.4: Dev gateway template
- Task 4.5: Shared packages templates

## Inputs
- Built CLI (`pnpm build`)
- Verification commands from PLAN.md

## Outputs / Deliverables
- Verified working minimal preset
- Any bug fixes applied to templates or scaffolder
- Documentation of any issues found and resolved

## Acceptance Criteria
- [ ] `pnpm build && node dist/index.js --preset minimal -y` creates a project directory
- [ ] Generated project structure matches expected layout
- [ ] `cd <project> && pnpm install` succeeds
- [ ] `pnpm build` in generated project succeeds (all workspaces compile)
- [ ] `pnpm test` in generated project passes (all tests green)
- [ ] `pnpm dev` starts all dev servers (health:3001, users:3002, gateway:3000)
- [ ] `curl http://localhost:3001/health` returns 200
- [ ] Variable substitution is correct (project name appears in package.json files)
- [ ] `pnpm-workspace.yaml` has correct entries for minimal preset

## Implementation Notes
- This is a manual verification task -- run through the full loop and fix issues
- Common issues: incorrect relative paths, missing dependencies, wrong workspace references
- Test both interactive and non-interactive modes
- Check that no leftover `{{variable}}` placeholders remain in generated files
- Verify that `// @feature:X` lines for disabled features are completely removed

## Estimated Complexity
Medium -- Integration verification with potential debugging

## Status
- [ ] Not Started
