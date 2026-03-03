# Task: Write template-helpers unit tests

## ID
7.3

## Description
Create unit tests for the template helper functions in `test/template-helpers.test.ts`. Tests should verify template directory resolution, variable map generation, and workspace entry generation for each preset.

## Dependencies
- Task 3.3: Template helpers implementation

## Inputs
- `getTemplateDirs()`, `getVariableMap()`, `getWorkspaceEntries()` from template-helpers.ts
- Feature flags for each preset

## Outputs / Deliverables
- `test/template-helpers.test.ts`

## Acceptance Criteria
- [ ] Tests verify `getTemplateDirs` returns correct directories for each preset
- [ ] Tests verify base directories always included regardless of preset
- [ ] Tests verify optional directories only included when feature flag is true
- [ ] Tests verify `getVariableMap` returns all required variables
- [ ] Tests verify `getWorkspaceEntries` returns correct pnpm workspace globs per preset
- [ ] All tests pass with `pnpm test`

## Implementation Notes
- Pure function tests -- test input/output pairs
- Verify that directory lists are in the expected order
- Check that no directories are duplicated
- Verify workspace entries match actual template directory structure

## Estimated Complexity
Low -- Pure function tests with clear expected outputs

## Status
- [x] Complete
