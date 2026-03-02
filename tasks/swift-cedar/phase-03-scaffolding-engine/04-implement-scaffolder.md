# Task: Implement core scaffolder

## ID
3.4

## Description
Create `src/scaffolder.ts` -- the main orchestration module that takes a `ProjectConfig` and produces a fully scaffolded project directory. It coordinates template copying, variable substitution, conditional processing, pnpm-workspace.yaml generation, git init, and dependency installation.

## Dependencies
- Task 3.1: fs.ts utilities for file operations
- Task 3.2: git.ts and pnpm.ts utilities
- Task 3.3: template-helpers.ts for directory and variable resolution

## Inputs
- Complete `ProjectConfig` object
- Template directory path (resolved at runtime via `__dirname`)

## Outputs / Deliverables
- `src/scaffolder.ts` exporting `scaffold(config: ProjectConfig): Promise<void>`

## Acceptance Criteria
- [ ] Creates the project directory at `process.cwd()/<projectName>`
- [ ] Errors if the target directory already exists (with clear message)
- [ ] Copies all applicable template directories using `copyDir`
- [ ] Applies variable substitution to all `.hbs` files
- [ ] Processes `// @feature:X` conditionals in all text files
- [ ] Generates `pnpm-workspace.yaml` programmatically (not from template)
- [ ] Optionally runs `git init` based on config
- [ ] Optionally runs `pnpm install` based on config
- [ ] Provides progress feedback via clack spinner/log for each major step
- [ ] Template path resolved via `path.resolve(__dirname, "..", "templates")`

## Implementation Notes
- The scaffold function should be the single entry point called from index.ts
- Use `clack.spinner()` for visual progress during each scaffolding step
- The `pnpm-workspace.yaml` must be built programmatically because workspace entries vary by preset
- Template resolution: `path.resolve(__dirname, "..", "templates")` since dist/index.js is one level below root
- Handle the case where the user runs the CLI from within an existing project
- Consider making each step (copy base, copy infra, etc.) a separate logged action for visibility

## Estimated Complexity
High -- Central orchestration module coordinating multiple subsystems

## Status
- [x] Complete
