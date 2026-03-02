# Task: Create base template files

## ID
3.5

## Description
Create the `templates/base/` directory with root configuration files that every generated project receives regardless of preset. These are the foundational files for the monorepo: root package.json, turbo.json, tsconfig base, gitignore, etc.

## Dependencies
- Task 3.1: fs.ts must handle `_` prefix renaming and `.hbs` variable substitution
- Task 3.3: template-helpers.ts must include variable map for base templates

## Inputs
- Generated project structure from PLAN.md
- Template conventions: `_` prefix for dotfiles, `.hbs` for variable files
- Variables: `{{projectName}}`, `{{awsRegion}}`

## Outputs / Deliverables
- `templates/base/` containing:
  - `package.json.hbs` -- root monorepo package.json with project name and scripts
  - `turbo.json` -- Turborepo pipeline configuration (build, dev, test, lint)
  - `_gitignore` -- standard Node.js gitignore
  - `tsconfig.json` -- root tsconfig with project references or path aliases
  - `_prettierrc` -- Prettier configuration
  - `_eslintrc.json` or equivalent -- ESLint config (or reference to shared config)

## Acceptance Criteria
- [ ] `templates/base/package.json.hbs` has `{{projectName}}` placeholder for the name field
- [ ] Root package.json includes scripts: `dev`, `build`, `test`, `lint`
- [ ] `turbo.json` defines pipeline for: `build` (dependent), `dev` (persistent), `test`, `lint`
- [ ] `_gitignore` covers: node_modules, dist, .cdk.staging, cdk.out, .env*.local
- [ ] All files follow template conventions (underscore prefix, .hbs suffix where needed)
- [ ] Files can be processed by the scaffolder without errors

## Implementation Notes
- The root `package.json` should have `"private": true` since it's a monorepo root
- Turbo dev task needs `"persistent": true` for watch-mode servers
- Do NOT include `pnpm-workspace.yaml` as a template -- it's built programmatically
- Keep the root package.json minimal -- workspace packages have their own dependencies
- Include `"dev": "turbo run dev"`, `"build": "turbo run build"`, `"test": "turbo run test"` in scripts

## Estimated Complexity
Medium -- Requires understanding monorepo tooling configuration

## Status
- [x] Complete
