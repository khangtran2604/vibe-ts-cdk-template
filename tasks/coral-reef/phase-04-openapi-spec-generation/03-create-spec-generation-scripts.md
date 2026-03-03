# Task: Create spec generation scripts

## ID
4.3

## Description
Create the build-time scripts that use `OpenApiGeneratorV31` to generate `dist/openapi.json` from the OpenAPI registry. One script for users service, one for module generator template, and one for health service. These are executed via `tsx` during the build step.

## Dependencies
- Task 4.1: Users openapi.ts must exist (imports the registry)
- Task 4.2: Module openapi.ts.hbs must exist

## Inputs
- OpenAPI registries from each service's `openapi.ts`

## Outputs / Deliverables
- `templates/services/users/src/generate-spec.ts`
- `templates/services/health/src/generate-spec.ts`
- `templates/generators/module/src/generate-spec.ts.hbs`

## Acceptance Criteria
- [ ] Each script imports the registry from its local `./openapi.js`
- [ ] Uses `OpenApiGeneratorV31` to generate the document
- [ ] Sets appropriate `info.title` and `info.version` fields
- [ ] Writes output to `dist/openapi.json` using `fs.writeFileSync`
- [ ] Creates `dist/` directory if it does not exist (using `mkdirSync` with recursive)
- [ ] Module generator version uses template variables for title
- [ ] OpenAPI version is set to "3.1.0"

## Implementation Notes
- Import `OpenApiGeneratorV31` from `@asteasolutions/zod-to-openapi`
- The generator takes `registry.definitions` as input
- `generateDocument()` accepts an object with `info` (title, version) and `openapi` (version string)
- Use `writeFileSync` from `node:fs` and `mkdirSync` with `{ recursive: true }`
- For the module template, use `{{moduleName}}` in the title
- Health service spec is very simple -- just one endpoint

## Estimated Complexity
Medium -- Straightforward but three files to create with slight variations

## Status
- [ ] Not Started
