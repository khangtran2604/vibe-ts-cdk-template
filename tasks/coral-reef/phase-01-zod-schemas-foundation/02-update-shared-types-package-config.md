# Task: Update shared-types package config

## ID
1.2

## Description
Update the shared-types package configuration to include Zod and zod-to-openapi as dependencies, and re-export the new schemas module from the package entry point. This ensures all services can import envelope schemas from `@<project>/shared-types/schemas`.

## Dependencies
- Task 1.1: The schemas.ts file must exist before re-exporting it

## Inputs
- `templates/packages/shared-types/package.json.hbs` (existing package config)
- `templates/packages/shared-types/src/index.ts` (existing entry point)
- Verified latest versions of `zod` and `@asteasolutions/zod-to-openapi`

## Outputs / Deliverables
- Modified `templates/packages/shared-types/package.json.hbs` with new dependencies
- Modified `templates/packages/shared-types/src/index.ts` with schemas re-export

## Acceptance Criteria
- [ ] `package.json.hbs` lists `zod` as a production dependency
- [ ] `package.json.hbs` lists `@asteasolutions/zod-to-openapi` as a production dependency (services need it at build time but shared-types exports the extended schemas)
- [ ] `src/index.ts` includes `export * from "./schemas.js"`
- [ ] Existing exports in `index.ts` are preserved
- [ ] Version numbers use latest stable (verified via npm view)

## Implementation Notes
- Both `zod` and `@asteasolutions/zod-to-openapi` should be regular dependencies in shared-types since other packages import the schemas at build time
- The `index.ts` re-export ensures `import { ApiResponseSchema } from "@<project>/shared-types"` works
- Preserve all existing exports -- only add the new re-export line

## Estimated Complexity
Low -- Simple configuration changes

## Status
- [ ] Not Started
