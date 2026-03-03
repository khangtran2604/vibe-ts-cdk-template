# Task: Add Auth Template Variables to Module Helpers

## ID
2.1

## Description
Add 7 new template variables to `getModuleVariableMap()` in `src/module-helpers.ts` that control whether the `localAuth` middleware import, const declaration, and per-endpoint middleware are included in generated `app.ts` files.

## Dependencies
None (this is CLI source code, independent of template files)

## Inputs
- `src/module-helpers.ts` (existing file with `getModuleVariableMap()`)
- Module config type that includes `protectedEndpoints` information

## Outputs / Deliverables
- Modified `src/module-helpers.ts` with 7 new variables in the variable map

## Acceptance Criteria
- [ ] `localAuthImport` variable: full import statement when protected, empty string when not
- [ ] `localAuthConst` variable: `\nconst auth = localAuth();\n` when protected, empty string when not
- [ ] `createAuthMiddleware`, `getAuthMiddleware`, `listAuthMiddleware`, `updateAuthMiddleware`, `deleteAuthMiddleware` variables: `"auth, "` when that endpoint is protected, empty string when not
- [ ] `localAuthImport` is placed BEFORE `projectName` in the variable map so embedded `{{projectName}}` gets resolved in a second pass
- [ ] Any endpoint being protected triggers `localAuthImport` and `localAuthConst` (they appear if ANY endpoint is protected)
- [ ] Per-endpoint granularity: only individually selected protected endpoints get the `auth, ` prefix

## Implementation Notes
- The `localAuthImport` value contains `{{projectName}}` which needs to be resolved by subsequent variable substitution. This is the same pattern used by `authorizerSetup`. Place it early in the map.
- Check `protectedEndpoints` from the module config to determine which CRUD operations are protected.
- A helper function `hasAnyProtectedEndpoint(endpoints)` may be useful to determine if the import/const are needed.

## Estimated Complexity
Medium -- Multiple variables with conditional logic and ordering concerns.

## Status
- [ ] Not Started
