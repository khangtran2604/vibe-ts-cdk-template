# Task: Wire prompts and presets into CLI entry point

## ID
2.3

## Description
Update `src/index.ts` to connect the commander argument parsing with the clack prompts flow. When the CLI is invoked, it should parse flags, pass them to `runPrompts()`, resolve feature flags via `getFeatureFlags()`, and produce a complete `ProjectConfig`. At this stage, the config is logged to console (scaffolding comes in Phase 3).

## Dependencies
- Task 1.5: CLI entry point must exist with commander setup
- Task 2.1: prompts.ts must be implemented
- Task 2.2: presets.ts must be implemented

## Inputs
- Commander parsed options from index.ts
- `runPrompts()` from prompts.ts
- `getFeatureFlags()` from presets.ts

## Outputs / Deliverables
- Updated `src/index.ts` that runs the full prompt flow and outputs a `ProjectConfig`

## Acceptance Criteria
- [ ] Running `node dist/index.js` triggers interactive prompts
- [ ] Running `node dist/index.js --preset minimal -y` skips prompts and uses defaults
- [ ] The resolved `ProjectConfig` is logged to console (temporary, replaced by scaffolding in Phase 3)
- [ ] Feature flags are correctly resolved from the selected preset
- [ ] All CLI flags correctly override their corresponding prompts
- [ ] Ctrl+C at any prompt exits gracefully

## Implementation Notes
- The flow is: parse CLI args -> run prompts (skipping already-provided values) -> resolve feature flags -> produce ProjectConfig
- Use `clack.log.info(JSON.stringify(config, null, 2))` to display the config for verification
- This is a temporary verification step -- the console.log will be replaced by the scaffold call in Phase 3

## Estimated Complexity
Medium -- Integration of multiple modules with conditional flow

## Status
- [ ] Not Started
