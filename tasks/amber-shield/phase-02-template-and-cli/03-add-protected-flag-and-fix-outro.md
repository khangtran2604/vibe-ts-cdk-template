# Task: Add --protected Flag to CLI and Fix pnpm build in Outro

## ID
2.3

## Description
Update `src/index.ts` to register the `--protected` option on the `module` subcommand, pass it through to `runModulePrompts`, and fix the missing `pnpm build` step in the "Next steps" outro message.

## Dependencies
- Task 2.2: The prompt flow must handle the `protected` flag before we wire it up in the CLI entry point

## Inputs
- Existing `src/index.ts` with `module` subcommand definition
- Current "Next steps" outro logic (around line 122-124)

## Outputs / Deliverables
- Updated `src/index.ts` with `--protected` option and fixed outro

## Acceptance Criteria
- [ ] `module` subcommand has `.option("--protected", "Protect endpoints with Cognito authorizer", false)`
- [ ] Options type passed to the action handler includes `protected: boolean`
- [ ] `protected` value is forwarded to `runModulePrompts()`
- [ ] "Next steps" outro includes `pnpm build` between `cd` and `pnpm dev` when `installDeps` is true
- [ ] "Next steps" outro includes `pnpm build` between `pnpm install` and `pnpm dev` when `installDeps` is false
- [ ] `pnpm build` passes without errors

## Implementation Notes
Two separate changes in the same file:

1. Add the `--protected` option:
```typescript
.option("--protected", "Protect endpoints with Cognito authorizer", false)
```

2. Fix the outro steps:
```typescript
const baseSteps = config.installDeps
  ? [`  cd ${config.projectName}`, `  pnpm build`, `  pnpm dev`]
  : [`  cd ${config.projectName}`, `  pnpm install`, `  pnpm build`, `  pnpm dev`];
```

## Estimated Complexity
Low -- Two small, well-defined changes in a single file.

## Status
- [x] Complete
