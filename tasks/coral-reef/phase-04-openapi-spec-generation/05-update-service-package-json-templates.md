# Task: Update service package.json templates

## ID
4.5

## Description
Update the `package.json.hbs` files for all services (users, health) and the module generator to include Zod dependencies and the `generate:openapi` build script. The build script should chain spec generation after TypeScript compilation.

## Dependencies
- Task 4.1: Users openapi.ts must exist
- Task 4.2: Module openapi.ts.hbs must exist
- Task 4.4: Health openapi.ts must exist

## Inputs
- `templates/services/users/package.json.hbs`
- `templates/services/health/package.json.hbs`
- `templates/generators/module/package.json.hbs`
- Verified package versions from task 1.3

## Outputs / Deliverables
- Modified `templates/services/users/package.json.hbs`
- Modified `templates/services/health/package.json.hbs`
- Modified `templates/generators/module/package.json.hbs`

## Acceptance Criteria
- [ ] Users package.json has `zod` as production dependency
- [ ] Users package.json has `@asteasolutions/zod-to-openapi` as devDependency
- [ ] Health package.json has `@asteasolutions/zod-to-openapi` as devDependency (zod via shared-types)
- [ ] Module package.json has `zod` as production dependency and `@asteasolutions/zod-to-openapi` as devDependency
- [ ] All three have `"generate:openapi": "tsx src/generate-spec.ts"` script
- [ ] All three have build script chaining: `"build": "tsc --build && tsx src/generate-spec.ts"`
- [ ] Version numbers match latest stable (from task 1.3)
- [ ] `tsx` is listed as a devDependency if not already present

## Implementation Notes
- `zod` is a **production** dependency in services because it is used for runtime validation in Lambda handlers
- `@asteasolutions/zod-to-openapi` is a **devDependency** because it is only used at build time for spec generation
- The build script chains: first compile TypeScript, then generate the OpenAPI spec
- Verify `tsx` is already available or add it as a devDependency (it is used to run the generate-spec.ts script)
- Keep existing scripts intact -- only add/modify the build and generate:openapi entries

## Estimated Complexity
Medium -- Three files to update with careful dependency placement

## Status
- [ ] Not Started
