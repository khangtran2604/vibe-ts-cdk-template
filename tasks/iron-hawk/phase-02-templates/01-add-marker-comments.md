# Task: Add Marker Comments to Existing Templates

## ID
2.1

## Description
Add injection marker comments to existing scaffolding templates so the module generator can programmatically insert new imports, stack instantiations, and gateway routes. These markers act as anchors for the `injectBeforeMarker` utility.

## Dependencies
None

## Inputs
- Existing `templates/infra/src/index.ts.hbs`
- Existing `templates/dev-gateway/src/gateway.ts`

## Outputs / Deliverables
- Updated `templates/infra/src/index.ts.hbs` with `// @module-inject:import` and `// @module-inject:instance` markers
- Updated `templates/dev-gateway/src/gateway.ts` with `// @module-inject:route` marker

## Acceptance Criteria
- [ ] `templates/infra/src/index.ts.hbs` contains `// @module-inject:import` after the existing feature-conditional imports
- [ ] `templates/infra/src/index.ts.hbs` contains `// @module-inject:instance` after the existing feature-conditional stack instantiations
- [ ] `templates/dev-gateway/src/gateway.ts` contains `// @module-inject:route` inside the ROUTES object before its closing brace
- [ ] Markers are placed on their own lines with appropriate indentation
- [ ] Existing scaffolding output is unchanged (markers are just comments, they do not affect runtime behavior)
- [ ] Build and test pass: `pnpm build && pnpm test`

## Implementation Notes
- Read the existing template files to understand their structure before adding markers.
- The markers should be placed at logical insertion points:
  - `// @module-inject:import` -- after all existing import statements so new module imports are appended
  - `// @module-inject:instance` -- after all existing stack instantiation blocks so new stacks are appended
  - `// @module-inject:route` -- inside the routes/services mapping object
- Markers must survive the template variable substitution process (they contain no `{{}}` placeholders).

## Estimated Complexity
Low -- Adding comment lines to two existing files.

## Status
- [ ] Not Started
