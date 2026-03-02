# Phase 2: Interactive Prompts

## Overview
Implement the full interactive CLI prompt flow using @clack/prompts and the preset-to-feature-flags mapping. By the end of this phase, running the CLI produces a complete `ProjectConfig` object ready for scaffolding.

## Prerequisites
Phase 1 complete -- CLI entry point works with `--help` and `--version`.

## Tasks
| # | Task | Complexity | Dependencies | Status |
|---|------|-----------|--------------|--------|
| 2.1 | Implement interactive prompts with @clack/prompts | Medium | 1.4, 1.1 | ✅ Complete |
| 2.2 | Implement preset-to-feature-flags mapping | Low | 1.4 | ✅ Complete |
| 2.3 | Wire prompts and presets into CLI entry point | Medium | 1.5, 2.1, 2.2 | ✅ Complete |

## Phase Completion Criteria
- [x] Interactive prompt flow works end-to-end
- [x] Non-interactive mode (`-y`) works with sensible defaults
- [x] All CLI flags correctly override prompts
- [x] Feature flags correctly derived from preset selection
- [x] Ctrl+C handled gracefully at every prompt

## Progress: 3/3 tasks complete
