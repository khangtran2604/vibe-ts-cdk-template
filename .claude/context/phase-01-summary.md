# Phase 1 Summary: Foundations

## Completed On
2026-03-03

## What Was Built

- `src/types.ts` — Added `ModuleConfig` interface (moduleName, entityName, port, projectDir, projectName, installDeps)
- `src/module-helpers.ts` — Pure string utility functions for module name transforms and marker-based injection
- `src/module-context.ts` — Async project detection, name reading, and port scanning
- `src/utils/paths.ts` — Extracted `resolveTemplateRoot()` + shared `pathExists()` utility
- `src/scaffolder.ts` — Updated to import from shared utils (no behavior change)
- `test/module-helpers.test.ts` — 86 tests for all string transforms and injection
- `test/module-context.test.ts` — 49 tests for project detection, name reading, port scanning
- `test/utils/paths.test.ts` — 15 tests for pathExists and resolveTemplateRoot

## Key APIs (for downstream tasks)

- `ModuleConfig` — Configuration interface consumed by generator engine and prompts
- `toPascalCase(kebab): string` — "order-items" → "OrderItems"
- `toEntityName(kebab): string` — "order-items" → "OrderItem" (singular, handles ies/ses/xes/zes)
- `toEntityNameLower(kebab): string` — "order-items" → "orderItem"
- `toFlatLower(kebab): string` — "order-items" → "orderitems"
- `getModuleVariableMap(config: ModuleConfig): Record<string, string>` — 8-key variable map for template substitution
- `injectBeforeMarker(content, marker, newLine): string` — Insert line before marker comment, preserves marker
- `detectProjectContext(projectDir): Promise<void>` — Validates scaffolded project structure
- `readProjectName(projectDir): Promise<string>` — Reads name from package.json
- `scanNextPort(projectDir): Promise<number>` — Returns next available dev-server port
- `pathExists(p): Promise<boolean>` — Shared async path existence check
- `resolveTemplateRoot(): string` — Shared template directory resolution

## Patterns Established

- Module-scope compiled regex constants (e.g. `PORT_RE`) for reuse
- `Promise.all` for concurrent independent I/O checks with aggregated error reporting
- Shared utilities in `src/utils/paths.ts` for cross-module path helpers
- Simple singularization: handles trailing s, ss, ies→y, ses/xes/zes without inflection library

## Decisions Made

- `pathExists` extracted to shared util rather than duplicated
- Singularization covers common patterns (s, ss, ies, ses, xes, zes) without external library
- `entityName`/`EntityName` both map to PascalCase config value (alias for template flexibility)
- `injectBeforeMarker` auto-applies marker-line indentation, caller passes un-indented content

## Dependencies Added

None — all Phase 1 code uses only Node.js built-ins.

## Known Limitations

- Singularization is naive — uncommon plurals (e.g. "mice", "children") not handled
- `scanNextPort` only checks `const PORT = N` pattern in dev-server.ts files
