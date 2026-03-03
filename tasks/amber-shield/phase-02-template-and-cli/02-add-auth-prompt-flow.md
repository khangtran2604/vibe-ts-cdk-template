# Task: Add Auth Prompt Flow to module-prompts.ts

## ID
2.2

## Description
Update `src/module-prompts.ts` to handle the `--protected` flag. When the flag is set, validate auth support exists, then either auto-select all endpoints (with `-y`) or show a `clack.multiselect` for endpoint selection. Include the protected endpoints info in the summary note and return `protectedEndpoints` in the config.

## Dependencies
- Task 1.1: Needs `ProtectedEndpoints` type
- Task 1.2: Needs `detectAuthSupport()` function

## Inputs
- `ProtectedEndpoints` type from `src/types.ts`
- `detectAuthSupport()` from `src/module-context.ts`
- Existing `runModulePrompts()` function signature and flow
- Existing flags parameter type

## Outputs / Deliverables
- Updated `src/module-prompts.ts` with auth prompt logic

## Acceptance Criteria
- [ ] `flags` parameter type extended to include `protected?: boolean`
- [ ] When `--protected` is set, `detectAuthSupport()` is called
- [ ] If auth dir is missing, displays error via `clack.log.error()` and calls `process.exit(1)`
- [ ] With `--protected -y`: all 5 endpoints set to `true` (no prompt shown)
- [ ] With `--protected` (interactive): `clack.multiselect` shown with 5 endpoint options, all pre-selected, `required: true`
- [ ] Without `--protected`: `protectedEndpoints` is `undefined` in returned config
- [ ] Summary note includes "Protected: list, get, create, update, delete" (or whichever endpoints were selected)
- [ ] `pnpm build` passes without errors

## Implementation Notes
The multiselect should look like:
```typescript
const selected = await clack.multiselect({
  message: "Which endpoints should require authentication?",
  options: [
    { value: "list", label: "GET / (list)", hint: "List all" },
    { value: "get", label: "GET /:id (get)", hint: "Get by ID" },
    { value: "create", label: "POST / (create)", hint: "Create" },
    { value: "update", label: "PUT /:id (update)", hint: "Update" },
    { value: "delete", label: "DELETE /:id (delete)", hint: "Delete" },
  ],
  initialValues: ["list", "get", "create", "update", "delete"],
  required: true,
});
```

Convert the selected array into a `ProtectedEndpoints` object.

## Estimated Complexity
Medium -- Multiple code paths (flag absent, flag + auto, flag + interactive, flag + no auth dir).

## Status
- [x] Complete
