# Task: Add ProtectedEndpoints Type and Extend ModuleConfig

## ID
1.1

## Description
Define the `ProtectedEndpoints` interface in `src/types.ts` and add an optional `protectedEndpoints` field to the existing `ModuleConfig` interface. This is the foundational type change that all other tasks depend on.

## Dependencies
None

## Inputs
- Existing `src/types.ts` with current `ModuleConfig` interface

## Outputs / Deliverables
- Updated `src/types.ts` with `ProtectedEndpoints` interface and extended `ModuleConfig`

## Acceptance Criteria
- [ ] `ProtectedEndpoints` interface has boolean fields: `list`, `get`, `create`, `update`, `delete`
- [ ] `ModuleConfig` has optional field `protectedEndpoints?: ProtectedEndpoints`
- [ ] `ProtectedEndpoints` is exported
- [ ] Existing types remain unchanged
- [ ] `pnpm build` passes without errors

## Implementation Notes
The interface should be placed near the `ModuleConfig` definition for logical grouping. The field is optional because unprotected modules (the default) will not have it set.

```typescript
export interface ProtectedEndpoints {
  list: boolean;
  get: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}
```

## Estimated Complexity
Low -- Adding a small interface and one optional field.

## Status
- [ ] Not Started
