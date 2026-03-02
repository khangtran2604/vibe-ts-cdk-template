# Task: Verify standard preset end-to-end

## ID
5.5

## Description
Run the full verification loop for the standard preset: build the CLI, generate a project, install dependencies, verify all workspaces build and test. Ensure that the frontend, auth, and e2e additions work alongside the minimal preset foundation.

## Dependencies
- Task 5.1: Frontend template
- Task 5.2: Auth template
- Task 5.3: E2E template
- Task 5.4: Frontend stack template

## Inputs
- Built CLI (`pnpm build`)
- Verification commands from PLAN.md

## Outputs / Deliverables
- Verified working standard preset
- Any bug fixes applied

## Acceptance Criteria
- [ ] `pnpm build && node dist/index.js --preset standard -y` generates a complete project
- [ ] Generated project has: infra, services, dev-gateway, packages, frontend, auth, e2e directories
- [ ] `pnpm install` succeeds in generated project
- [ ] `pnpm build` succeeds for all workspaces
- [ ] `pnpm test` passes for all workspaces
- [ ] Frontend dev server starts and renders the home page
- [ ] CDK app entry point includes frontend and auth stack imports (conditionals processed)
- [ ] `pnpm-workspace.yaml` includes all standard preset entries
- [ ] No leftover `// @feature:X` lines for enabled features; disabled feature lines removed

## Implementation Notes
- Pay special attention to workspace cross-references (frontend referencing shared packages)
- Verify that auth stack is correctly instantiated in the CDK app
- Check that e2e tests can find and interact with the frontend
- Ensure turbo.json pipeline handles the new workspaces correctly

## Estimated Complexity
Medium -- Integration verification across more workspaces

## Status
- [ ] Not Started
