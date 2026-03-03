# Phase 3 Summary: Generator Engine

## Completed On
2026-03-03

## What Was Built

- `src/module-generator.ts` — Core `generateModule()` function orchestrating template copy, CDK stack generation, code injection, and optional dependency installation
- `test/module-generator.test.ts` — 34 integration tests using real temp directories

## Key APIs (for downstream tasks)

- `generateModule(config: ModuleConfig): Promise<void>` — Entry point for module generation. Takes a fully-resolved ModuleConfig and performs all steps: duplicate guard → copy service templates → generate CDK stack → inject import/instance/route → optional pnpm install.

## Patterns Established

- `NO_FEATURES` constant (all-false FeatureFlags) for passing to `copyDir()` when feature conditionals are irrelevant
- Marker constants (`MARKER_IMPORT`, `MARKER_INSTANCE`, `MARKER_ROUTE`) colocated with the code that uses them
- Multi-step spinner pattern: start/stop per I/O-heavy step, with try/catch to stop spinner on error before rethrowing
- Both import and instance injections applied to the same in-memory string before a single `writeFile` call (avoids double I/O)

## Decisions Made

- Task 3.2 (workspace update) is a no-op: `pnpm-workspace.yaml` already uses `"services/*"` glob, so new modules are auto-discovered
- No cleanup on partial failure — errors propagate to caller (matches scaffolder.ts pattern)
- `@clack/prompts` spinner used per-step (4 spinners total) for granular progress feedback
- Tests use real filesystem (temp dirs) rather than mocking fs, for true integration coverage

## Dependencies Added

None — all Phase 3 code uses existing project dependencies.

## Known Limitations

- No rollback on partial failure (e.g., if CDK stack writes but injection fails, service dir is not cleaned up)
- Module generator assumes markers exist in target files — will throw if markers are missing (by design, via injectBeforeMarker)
