# Task: Migrate types to re-export from schemas

## ID
2.3

## Description
Replace the manual TypeScript interface definitions in both the users service and module generator `types/index.ts` files with re-exports from the new schemas modules. This preserves all existing import paths (`from "../types/index.js"`) so no other files need to change.

## Dependencies
- Task 2.1: Users service schemas must exist
- Task 2.2: Module generator schemas must exist

## Inputs
- `templates/services/users/src/types/index.ts` (existing manual interfaces)
- `templates/generators/module/src/types/index.ts.hbs` (existing manual interfaces)

## Outputs / Deliverables
- Modified `templates/services/users/src/types/index.ts` -- re-exports types from `../schemas/index.js`
- Modified `templates/generators/module/src/types/index.ts.hbs` -- re-exports types from `../schemas/index.js`

## Acceptance Criteria
- [ ] Users `types/index.ts` re-exports `User`, `CreateUserBody`, `UpdateUserBody` from `"../schemas/index.js"`
- [ ] Module `types/index.ts.hbs` re-exports `{{EntityName}}`, `Create{{EntityName}}Body`, `Update{{EntityName}}Body` from `"../schemas/index.js"`
- [ ] Manual interface definitions are removed (replaced by re-exports)
- [ ] All existing import paths throughout the codebase remain valid
- [ ] No other files need to change as a result of this migration

## Implementation Notes
- The key insight: by making `types/index.ts` a re-export barrel, all existing `import { User } from "../types/index.js"` statements continue to work unchanged
- The types are now derived from Zod schemas via `z.infer<>` -- they are structurally identical to the old interfaces
- Keep any non-entity types that might exist in the types file (only replace the entity interfaces)

## Estimated Complexity
Low -- Simple file replacement, but must verify no other types are lost

## Status
- [ ] Not Started
