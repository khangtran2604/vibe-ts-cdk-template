# Task: Add Module Subcommand to index.ts

## ID
4.2

## Description
Modify `src/index.ts` to register a `module` subcommand using Commander's `.addCommand()`. The root command's existing `.action()` for project scaffolding remains unchanged. The new subcommand accepts a module name argument and options for install and defaults.

## Dependencies
- Task 3.1: Uses `generateModule()` from module-generator.ts
- Task 4.1: Uses `runModulePrompts()` from module-prompts.ts

## Inputs
- Existing `src/index.ts` with Commander program setup
- `generateModule` from `src/module-generator.ts`
- `runModulePrompts` from `src/module-prompts.ts`

## Outputs / Deliverables
- Updated `src/index.ts` with `module` subcommand registered

## Acceptance Criteria
- [ ] `module` subcommand is registered via `program.addCommand(moduleCommand)`
- [ ] Subcommand accepts a required `<name>` argument (module name in kebab-case)
- [ ] Subcommand supports `--no-install` option to skip pnpm install
- [ ] Subcommand supports `-y, --yes` option to accept defaults
- [ ] Subcommand action calls `runModulePrompts(name, options)` then `generateModule(config)`
- [ ] Existing root command (project scaffolding) is completely unaffected
- [ ] `<cli> --help` shows both the root command usage and the `module` subcommand
- [ ] `<cli> module --help` shows module-specific help
- [ ] Error handling: catches and displays errors from prompt/generator with user-friendly messages
- [ ] Build succeeds (`pnpm build`)

## Implementation Notes
```ts
const moduleCommand = new Command("module")
  .description("Generate a new CRUD service module")
  .argument("<name>", "Module name in kebab-case (e.g., orders, order-items)")
  .option("--no-install", "Skip pnpm install")
  .option("-y, --yes", "Accept defaults")
  .action(async (name, options) => {
    const config = await runModulePrompts(name, options);
    await generateModule(config);
  });
program.addCommand(moduleCommand);
```
- Make sure to import `Command` from `commander` if not already imported as a named import.
- The `.addCommand()` call should come before `program.parse()`.

## Estimated Complexity
Medium -- Wiring up the subcommand with proper argument/option handling and error boundaries.

## Status
- [ ] Not Started
