# Phase 3: Scaffolding Engine + Base Templates

## Overview
Build the core scaffolding engine that copies template directories, applies variable substitution, processes feature conditionals, and generates the base monorepo configuration files. By the end of this phase, the CLI can produce a project directory with root config files.

## Prerequisites
Phase 2 complete -- CLI produces a `ProjectConfig` from prompts/flags.

## Tasks
| # | Task | Complexity | Dependencies | Status |
|---|------|-----------|--------------|--------|
| 3.1 | Implement filesystem utility functions | Medium | 1.4 | ⬜ Not Started |
| 3.2 | Implement git, pnpm, and logger utilities | Low | 1.1 | ⬜ Not Started |
| 3.3 | Implement template-helpers.ts | Medium | 1.4, 2.2 | ⬜ Not Started |
| 3.4 | Implement core scaffolder | High | 3.1, 3.2, 3.3 | ⬜ Not Started |
| 3.5 | Create base template files | Medium | 3.1, 3.3 | ⬜ Not Started |
| 3.6 | Wire scaffolder into CLI entry point | Low | 2.3, 3.4 | ⬜ Not Started |

## Phase Completion Criteria
- [ ] `pnpm build && node dist/index.js --preset minimal -y` produces a directory
- [ ] Generated directory contains root config files with correct project name substitution
- [ ] `pnpm-workspace.yaml` is generated programmatically with correct entries
- [ ] Git init and pnpm install work when enabled
- [ ] Template variable substitution and conditional processing work correctly

## Progress: 0/6 tasks complete
