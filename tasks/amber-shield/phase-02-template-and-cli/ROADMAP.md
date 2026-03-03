# Phase 2: Template and CLI Integration

## Overview
Wire the auth variables into the CDK stack template, add the interactive prompt flow for endpoint selection, and register the `--protected` flag on the CLI. Also fixes the missing `pnpm build` in the outro.

## Prerequisites
Phase 1 complete -- types, context detection, and variable generation must be in place.

## Tasks
| # | Task | Complexity | Dependencies | Status |
|---|------|-----------|--------------|--------|
| 2.1 | Add auth placeholders to stack.ts.hbs template | Medium | 1.3 | ⬜ Not Started |
| 2.2 | Add auth prompt flow to module-prompts.ts | Medium | 1.1, 1.2 | ⬜ Not Started |
| 2.3 | Add --protected flag to CLI and fix outro | Low | 2.2 | ⬜ Not Started |

## Phase Completion Criteria
- [ ] Stack template includes auth placeholders that resolve cleanly in both protected and unprotected cases
- [ ] `--protected` flag is registered and wired through the full prompt flow
- [ ] Auth support validation prevents use on minimal preset projects
- [ ] Outro "Next steps" includes `pnpm build`
- [ ] `pnpm build` passes

## Progress: 0/3 tasks complete
