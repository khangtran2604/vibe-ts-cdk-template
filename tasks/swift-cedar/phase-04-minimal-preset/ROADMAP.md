# Phase 4: Minimal Preset Templates

## Overview
Create all template files needed for the minimal preset: CDK infrastructure, health and users services, dev gateway, and shared packages. By the end of this phase, generating a project with the minimal preset produces a fully working monorepo.

## Prerequisites
Phase 3 complete -- scaffolding engine can copy templates with variable substitution and conditional processing.

## Tasks
| # | Task | Complexity | Dependencies | Status |
|---|------|-----------|--------------|--------|
| 4.1 | Create CDK infrastructure templates | High | 3.5, 3.1 | ⬜ Not Started |
| 4.2 | Create health service template | Medium | 3.5, 4.5 | ⬜ Not Started |
| 4.3 | Create users service template | High | 4.2, 4.5 | ⬜ Not Started |
| 4.4 | Create dev gateway template | Medium | 4.2, 4.3 | ⬜ Not Started |
| 4.5 | Create shared packages templates | High | 3.5 | ⬜ Not Started |
| 4.6 | Verify minimal preset end-to-end | Medium | 3.6, 4.1-4.5 | ⬜ Not Started |

## Phase Completion Criteria
- [ ] `node dist/index.js --preset minimal -y` generates a complete project
- [ ] Generated project: `pnpm install && pnpm build && pnpm test` all succeed
- [ ] Generated project: `pnpm dev` starts all dev servers
- [ ] All template variables and conditionals processed correctly

## Progress: 0/6 tasks complete
