# Task: Create module-helpers.ts

## ID
1.2

## Description
Create `src/module-helpers.ts` with pure string utility functions for module name transformations and a marker-based content injection function. These are the core building blocks used by the generator to transform templates and inject code into existing files.

## Dependencies
- Task 1.1: Needs `ModuleConfig` type for `getModuleVariableMap()` function signature

## Inputs
- `ModuleConfig` interface from `src/types.ts`

## Outputs / Deliverables
- New file `src/module-helpers.ts` with all exported functions

## Acceptance Criteria
- [ ] `toPascalCase("order-items")` returns `"OrderItems"`
- [ ] `toPascalCase("orders")` returns `"Orders"`
- [ ] `toEntityName("order-items")` returns `"OrderItem"` (singular PascalCase)
- [ ] `toEntityName("orders")` returns `"Order"` (singular PascalCase)
- [ ] `toEntityNameLower("order-items")` returns `"orderItem"` (singular camelCase)
- [ ] `toFlatLower("order-items")` returns `"orderitems"` (no separators, all lowercase)
- [ ] `getModuleVariableMap(config)` returns a `Record<string, string>` with keys: `moduleName`, `ModuleName`, `entityName`, `EntityName`, `entityNameLower`, `flatLower`, `port`, `projectName`
- [ ] `injectBeforeMarker(content, marker, newLine)` inserts `newLine` on the line before the marker comment, preserving the marker for future injections
- [ ] `injectBeforeMarker` handles the case where the marker is not found (throws or returns unchanged with warning)
- [ ] All functions are pure (no I/O, no side effects)
- [ ] Build succeeds (`pnpm build`)

## Implementation Notes
- For singularization in `toEntityName`, a simple approach is sufficient: strip trailing "s" if present. No need for a full inflection library. Handle edge cases like "statuses" -> "status" if desired, but simple cases like "orders" -> "Order" and "order-items" -> "OrderItem" are the priority.
- `injectBeforeMarker` should find the line containing the marker string, and insert the new line(s) immediately before it, keeping the same indentation as the marker line.
- The variable map keys should match the `{{placeholder}}` names used in generator templates (Phase 2).

## Estimated Complexity
Medium -- Multiple string transform functions plus the injection utility require careful edge-case handling.

## Status
- [ ] Not Started
