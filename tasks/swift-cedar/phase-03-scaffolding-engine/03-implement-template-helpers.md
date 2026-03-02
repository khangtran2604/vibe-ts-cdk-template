# Task: Implement template-helpers.ts

## ID
3.3

## Description
Create `src/template-helpers.ts` which maps `FeatureFlags` to the list of template directories to copy and the variable substitution map. This module is the bridge between the `ProjectConfig` and the filesystem operations -- it decides which templates get copied and what values fill the placeholders.

## Dependencies
- Task 1.4: types.ts for FeatureFlags, ProjectConfig interfaces
- Task 2.2: presets.ts for understanding feature flag structure

## Inputs
- `ProjectConfig` object (project name, region, features, etc.)
- Template directory structure from PLAN.md

## Outputs / Deliverables
- `src/template-helpers.ts` exporting:
  - `getTemplateDirs(features: FeatureFlags): string[]` -- ordered list of template subdirectories to copy
  - `getVariableMap(config: ProjectConfig): Record<string, string>` -- all `{{variable}}` replacements
  - `getWorkspaceEntries(features: FeatureFlags): string[]` -- entries for pnpm-workspace.yaml

## Acceptance Criteria
- [ ] `getTemplateDirs` always includes: `base`, `infra`, `services`, `dev-gateway`, `packages`
- [ ] `getTemplateDirs` conditionally includes: `frontend`, `auth`, `e2e`, `database`, `cicd`, `monitoring`, `extras`
- [ ] Template dirs are returned in the correct copy order
- [ ] `getVariableMap` includes at minimum: `projectName`, `awsRegion`
- [ ] `getWorkspaceEntries` returns correct pnpm workspace glob patterns based on features
- [ ] Minimal preset workspace entries include: `infra`, `services/*`, `dev-gateway`, `packages/*`
- [ ] Standard adds: `frontend`, `auth`, `e2e`
- [ ] Full adds all workspace entries

## Implementation Notes
- Template directories map 1:1 to subdirectories under `templates/`
- The variable map may expand as templates are created -- start with known variables and add as needed
- Workspace entries must match actual directory names in the generated project
- Keep the ordering consistent: base first, then infra, services, etc.

## Estimated Complexity
Medium -- Requires understanding the full template structure and feature-to-directory mapping

## Status
- [x] Complete
