# Task: Write presets unit tests

## ID
7.2

## Description
Create unit tests for the preset-to-feature-flags mapping in `test/presets.test.ts`. Tests should verify that each preset produces the correct feature flags and that the RDS option works correctly.

## Dependencies
- Task 2.2: Presets implementation

## Inputs
- `getFeatureFlags()` function from presets.ts
- Preset feature matrix from PLAN.md

## Outputs / Deliverables
- `test/presets.test.ts`

## Acceptance Criteria
- [ ] Tests verify minimal preset has all feature flags as false
- [ ] Tests verify standard preset enables: frontend, auth, e2e
- [ ] Tests verify full preset enables: frontend, auth, e2e, database, cicd, monitoring, hooks
- [ ] Tests verify `rds` flag only enabled when explicitly passed with full preset
- [ ] Tests verify feature flag completeness (no missing flags)
- [ ] All tests pass with `pnpm test`

## Implementation Notes
- These are simple pure-function tests -- no mocking needed
- Use snapshot testing or explicit assertions for each flag
- Consider table-driven tests for the preset matrix

## Estimated Complexity
Low -- Simple pure function tests

## Status
- [x] Complete
