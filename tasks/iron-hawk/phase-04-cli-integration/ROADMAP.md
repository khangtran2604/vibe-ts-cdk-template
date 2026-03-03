# Phase 4: CLI Integration

## Overview
Wire the module generator into the CLI as a Commander subcommand with interactive prompts. This makes the generator accessible to users via `<cli-name> module <name>`.

## Prerequisites
- Phase 3 complete (generator engine works)

## Tasks
| # | Task | Complexity | Dependencies | Status |
|---|------|-----------|--------------|--------|
| 4.1 | Create module-prompts.ts | Medium | 1.2, 1.3 | ✅ Complete |
| 4.2 | Add module subcommand to index.ts | Medium | 3.1, 4.1 | ✅ Complete |
| 4.3 | Update CLAUDE.md constraints | Low | 4.2 | ✅ Complete |

## Phase Completion Criteria
- [x] `<cli> module orders` generates a complete CRUD service module interactively
- [x] `<cli> module orders -y` generates with defaults (no prompts)
- [x] `<cli> module orders --no-install` skips pnpm install
- [x] CLAUDE.md updated to reflect subcommand support
- [x] Existing root command (project scaffolding) still works as before

## Progress: 3/3 tasks complete
