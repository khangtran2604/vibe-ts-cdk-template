# Task: Create pre-commit hooks template (Husky + lint-staged)

## ID
6.4

## Description
Create the `templates/extras/` directory with Husky pre-commit hooks and lint-staged configuration. This enforces code quality by running linters and formatters on staged files before each commit.

## Dependencies
- Task 3.5: Base templates (extras modify root config)

## Inputs
- Extras structure from PLAN.md: `.husky/pre-commit`, `lint-staged.config.js`
- Variables: `{{projectName}}`

## Outputs / Deliverables
- `templates/extras/_husky/pre-commit` -- Husky pre-commit hook
- `templates/extras/lint-staged.config.js` -- lint-staged configuration

## Acceptance Criteria
- [ ] Husky pre-commit hook runs lint-staged
- [ ] lint-staged config runs ESLint on `.ts`/`.tsx` files
- [ ] lint-staged config runs Prettier on all supported files
- [ ] Husky hook is executable (proper file permissions)
- [ ] Configuration works with the monorepo structure (handles workspace paths)

## Implementation Notes
- Husky v9 uses a simple shell script in `.husky/pre-commit`
- lint-staged config should handle the monorepo structure (files in various workspaces)
- The scaffolder may need to run `npx husky init` or set up the hook manually
- Pre-commit hook content: `npx lint-staged`
- Ensure the `_husky` directory correctly renames to `.husky` during scaffolding

## Estimated Complexity
Low -- Standard Husky + lint-staged configuration

## Status
- [ ] Not Started
