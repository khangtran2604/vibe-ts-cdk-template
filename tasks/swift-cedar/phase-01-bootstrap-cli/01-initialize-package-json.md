# Task: Initialize package.json with CLI bin entry

## ID
1.1

## Description
Create the root `package.json` for the CLI tool with proper bin field, scripts, and dependencies. This is the foundation file that defines the npm package, its entry point, and all development/production dependencies needed to build and run the CLI.

## Dependencies
None

## Inputs
- CLI name: `vibe-ts-cdk-template`
- Target Node version: 24.x LTS
- Package manager: pnpm
- Required dependencies: `commander`, `@clack/prompts`
- Required devDependencies: `tsup`, `vitest`, `typescript`, `tsx`

## Outputs / Deliverables
- `package.json` with:
  - `"bin": { "vibe-ts-cdk-template": "dist/index.js" }`
  - `"files": ["dist", "templates"]`
  - `"type": "module"`
  - All scripts: `build`, `dev`, `test`
  - All dependencies at latest stable versions

## Acceptance Criteria
- [ ] `package.json` exists at project root with correct `name`, `version` (0.1.0), `type: "module"`
- [ ] `bin` field maps `vibe-ts-cdk-template` to `dist/index.js`
- [ ] `files` field includes `["dist", "templates"]`
- [ ] `scripts` include `build` (tsup), `dev` (tsx or tsup --watch), `test` (vitest)
- [ ] All dependency versions verified via `npm view <pkg> version`
- [ ] `pnpm install` succeeds without errors

## Implementation Notes
- Run `npm view <pkg> version` for each dependency before adding to verify latest stable
- Use `"type": "module"` since tsup will output ESM
- The `files` field is critical -- without `templates` the published package won't include template files
- Add `engines: { "node": ">=24.0.0" }` to enforce Node version

## Estimated Complexity
Low -- Standard package.json creation with well-defined fields

## Status
- [ ] Not Started
