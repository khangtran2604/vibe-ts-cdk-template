# Task: Update CLAUDE.md Constraints

## ID
4.3

## Description
Update CLAUDE.md to remove the "Do NOT put subcommands on the CLI" constraint and document the new `module` subcommand. This reflects the explicit owner decision to add subcommand support.

## Dependencies
- Task 4.2: Subcommand must be implemented before documenting it

## Inputs
- Existing CLAUDE.md
- Implemented `module` subcommand behavior

## Outputs / Deliverables
- Updated CLAUDE.md

## Acceptance Criteria
- [ ] "Do NOT put subcommands on the CLI" line is removed from the "Do NOT" section
- [ ] Commands section updated to include `module` subcommand usage
- [ ] Brief description of what the `module` subcommand does
- [ ] Example usage: `node dist/index.js module orders -y`
- [ ] No other unrelated changes to CLAUDE.md

## Implementation Notes
- Add to the Commands section something like:
  ```
  pnpm build && node dist/index.js module <name> -y  # Generate a CRUD module in an existing project
  ```
- Update the Verification section to include the module generation verification steps from the plan.

## Estimated Complexity
Low -- Documentation update only.

## Status
- [ ] Not Started
