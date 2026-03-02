# Task: Create types.ts and constants.ts

## ID
1.4

## Description
Define the core TypeScript interfaces and constants that will be used throughout the CLI. This includes `ProjectConfig`, `Preset`, `FeatureFlags`, and CLI metadata like name and version. These types form the data contract between all CLI modules.

## Dependencies
- Task 1.2: tsconfig.json must exist for TypeScript to resolve types

## Inputs
- Preset tiers: minimal, standard, full
- Feature flags from preset matrix (see PLAN.md Presets table)
- CLI name: `vibe-ts-cdk-template`
- CLI version: read from package.json or hardcoded `0.1.0`

## Outputs / Deliverables
- `src/types.ts` -- `ProjectConfig`, `Preset`, `FeatureFlags` interfaces
- `src/constants.ts` -- CLI_NAME, CLI_VERSION, default values

## Acceptance Criteria
- [ ] `Preset` type is a union: `"minimal" | "standard" | "full"`
- [ ] `FeatureFlags` interface has boolean fields for: `frontend`, `auth`, `e2e`, `database`, `rds`, `cicd`, `monitoring`, `hooks`
- [ ] `ProjectConfig` interface includes: `projectName`, `preset`, `awsRegion`, `features` (FeatureFlags), `gitInit`, `installDeps`
- [ ] `constants.ts` exports `CLI_NAME` and `CLI_VERSION`
- [ ] All types compile without errors (`tsc --noEmit`)

## Implementation Notes
- Keep `FeatureFlags` flat -- no nested objects. Each feature is a simple boolean toggle.
- `ProjectConfig` should contain everything needed to scaffold a project -- it's the single data object passed from prompts to scaffolder.
- For `CLI_VERSION`, consider reading from package.json at build time or using a constant. Reading from package.json requires `resolveJsonModule` in tsconfig.
- AWS region could have a default value in constants (e.g., `us-east-1`).

## Estimated Complexity
Low -- Interface and constant definitions only

## Status
- [ ] Not Started
