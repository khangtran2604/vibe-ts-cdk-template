# Task: Create .gitignore and .npmrc for the CLI project

## ID
1.6

## Description
Add project configuration files for git and pnpm. The `.gitignore` should exclude build artifacts, node_modules, and test outputs. The `.npmrc` should configure pnpm behavior for the CLI project itself (not the generated projects).

## Dependencies
None

## Inputs
- Standard Node.js gitignore patterns
- pnpm configuration preferences

## Outputs / Deliverables
- `.gitignore` at project root
- `.npmrc` at project root

## Acceptance Criteria
- [ ] `.gitignore` excludes: `node_modules/`, `dist/`, `*.tgz`, `.DS_Store`, coverage output
- [ ] `.npmrc` exists with appropriate pnpm settings (e.g., `shamefully-hoist=false`)
- [ ] Neither file interferes with the `templates/` directory

## Implementation Notes
- Make sure `.gitignore` does not accidentally ignore files inside `templates/` that start with `.` or `_`
- Common `.npmrc` setting for pnpm: `shamefully-hoist=false` to enforce strict dependency resolution

## Estimated Complexity
Low -- Standard configuration files

## Status
- [ ] Not Started
