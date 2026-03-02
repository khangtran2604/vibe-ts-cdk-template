# Task: Implement preset-to-feature-flags mapping

## ID
2.2

## Description
Create `src/presets.ts` that maps each preset tier (minimal, standard, full) to its corresponding `FeatureFlags` object. This is the single source of truth for which features are included in each preset.

## Dependencies
- Task 1.4: types.ts must exist with Preset and FeatureFlags interfaces

## Inputs
- Preset feature matrix from PLAN.md:
  - minimal: infra, services, shared packages, dev-gateway (all base -- no feature flags needed)
  - standard: + frontend, auth, e2e
  - full: + database, cicd, monitoring, hooks (rds is a separate toggle)

## Outputs / Deliverables
- `src/presets.ts` exporting `getFeatureFlags(preset: Preset, options?: { rds?: boolean }): FeatureFlags`

## Acceptance Criteria
- [ ] `getFeatureFlags("minimal")` returns all flags as `false`
- [ ] `getFeatureFlags("standard")` returns `frontend: true`, `auth: true`, `e2e: true`, rest `false`
- [ ] `getFeatureFlags("full")` returns `frontend: true`, `auth: true`, `e2e: true`, `database: true`, `cicd: true`, `monitoring: true`, `hooks: true`, `rds: false`
- [ ] `getFeatureFlags("full", { rds: true })` returns same as full but with `rds: true`
- [ ] Function is pure with no side effects
- [ ] Exported types allow other modules to query preset configurations

## Implementation Notes
- Keep it simple: a record/map from preset name to FeatureFlags object
- The `rds` flag is only meaningful when `database` is true (full preset)
- Consider also exporting a `PRESET_DESCRIPTIONS` record for use in prompts
- This module should have no dependencies beyond types.ts

## Estimated Complexity
Low -- Simple mapping logic

## Status
- [ ] Not Started
