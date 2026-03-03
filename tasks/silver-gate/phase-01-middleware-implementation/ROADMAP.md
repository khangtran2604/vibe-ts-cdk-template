# Phase 1: Middleware Implementation

## Overview
Create the `localAuth` Hono middleware that enforces authentication on protected endpoints during local development, and wire it into the existing `lambdaToHono` adapter so Lambda handlers receive the same `requestContext.authorizer` claims as in production.

## Prerequisites
None -- this is the foundation phase.

## Tasks
| # | Task | Complexity | Dependencies | Status |
|---|------|-----------|--------------|--------|
| 1.1 | Create localAuth Hono middleware | Medium | None | ✅ Complete |
| 1.2 | Update lambdaToHono adapter to read authorizerClaims | Low | 1.1 | ✅ Complete |
| 1.3 | Export localAuth from lambda-utils index | Low | 1.1 | ✅ Complete |

## Phase Completion Criteria
- [x] `local-auth.ts` middleware exists with all 4 code paths (no header, bad format, bad JWT, valid JWT)
- [x] `lambda-adapter.ts` reads `authorizerClaims` from Hono context
- [x] `localAuth` is exported from the lambda-utils barrel file

## Progress: 3/3 tasks complete ✅
