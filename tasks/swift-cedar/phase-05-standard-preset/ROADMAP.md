# Phase 5: Standard Preset Templates

## Overview
Add frontend (Vite + React), authentication (Cognito + Lambda authorizer), and end-to-end testing (Playwright) templates. These build on top of the minimal preset to create a complete web application stack.

## Prerequisites
Phase 4 complete -- minimal preset generates a working project.

## Tasks
| # | Task | Complexity | Dependencies | Status |
|---|------|-----------|--------------|--------|
| 5.1 | Create frontend (Vite + React) template | Medium | 4.6 | ⬜ Not Started |
| 5.2 | Create Cognito auth template | Medium | 4.1 | ⬜ Not Started |
| 5.3 | Create Playwright e2e test template | Low | 5.1 | ⬜ Not Started |
| 5.4 | Create CDK frontend stack template | Medium | 4.1, 5.1 | ⬜ Not Started |
| 5.5 | Verify standard preset end-to-end | Medium | 5.1-5.4 | ⬜ Not Started |

## Phase Completion Criteria
- [ ] `node dist/index.js --preset standard -y` generates a project with frontend, auth, e2e
- [ ] Generated project builds, tests pass, dev servers start
- [ ] CDK synthesizes correctly with frontend and auth stacks
- [ ] Playwright e2e tests can run against the frontend

## Progress: 0/5 tasks complete
