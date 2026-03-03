# Task: Update README generator

## ID
6.1

## Description
Update the README generator (`src/utils/readme.ts`) to include an "API Documentation" section that tells users how to access the Swagger UI at `localhost:3000/docs` during local development.

## Dependencies
- Task 5.2: Swagger UI endpoint must be implemented so the documentation is accurate

## Inputs
- `src/utils/readme.ts` (existing README generator)

## Outputs / Deliverables
- Modified `src/utils/readme.ts` with API Documentation section

## Acceptance Criteria
- [ ] README includes an "API Documentation" section (## level heading)
- [ ] Section mentions running `pnpm dev` to start the dev server
- [ ] Section includes the URL `http://localhost:3000/docs` for Swagger UI
- [ ] Section is included for all presets (minimal, standard, full) since all have services
- [ ] Existing README sections are preserved

## Implementation Notes
- Per project memory MEMORY.md: "Any PR that touches templates, types, or scaffolder should verify the generated README is still accurate"
- The section should be concise -- 2-3 lines is sufficient
- Place it near the "Development" or "Getting Started" section of the README
- Consider adding a note about running `pnpm build` first to generate the specs

## Estimated Complexity
Low -- Small addition to existing generator

## Status
- [ ] Not Started
