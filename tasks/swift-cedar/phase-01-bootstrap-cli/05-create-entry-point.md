# Task: Create CLI entry point with commander

## ID
1.5

## Description
Create `src/index.ts` as the main CLI entry point using `commander` to parse command-line arguments. At this stage, it should handle `--help`, `--version`, and define the non-interactive flags (`--preset`, `--region`, `--rds`, `--no-git`, `--no-install`, `-y`). The actual prompt and scaffold logic will be wired in later phases.

## Dependencies
- Task 1.1: package.json with commander dependency
- Task 1.4: types.ts and constants.ts for CLI_NAME, CLI_VERSION, Preset type

## Inputs
- CLI_NAME and CLI_VERSION from constants.ts
- Preset type for option validation
- Commander flag definitions from PLAN.md CLI Interactive Flow section

## Outputs / Deliverables
- `src/index.ts` -- Working CLI entry point

## Acceptance Criteria
- [ ] `pnpm build` succeeds and produces `dist/index.js`
- [ ] `node dist/index.js --help` displays usage information with all flags
- [ ] `node dist/index.js --version` displays the CLI version
- [ ] Flags defined: `--preset <minimal|standard|full>`, `--region <aws-region>`, `--rds`, `--no-git`, `--no-install`, `-y` (skip prompts)
- [ ] Invalid preset value shows an error message
- [ ] Entry point is a proper ESM module

## Implementation Notes
- Use `commander`'s `program` API to define the CLI
- Do not add subcommands -- this is a single direct invocation tool
- The `-y` flag should set defaults for all prompts (project name from cwd or argument, preset default, etc.)
- Add placeholder comments where prompts (Phase 2) and scaffolding (Phase 3) will be wired in
- Consider adding a positional argument for project name: `vibe-ts-cdk-template <project-name>`

## Estimated Complexity
Medium -- Requires understanding of commander API and proper ESM setup

## Status
- [x] Complete
