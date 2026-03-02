# Phase 5 Summary: Standard Preset Templates

## Completed On
2026-03-02

## What Was Built

- `templates/frontend/` — Vite 7 + React 19 app with feature-based structure, react-router 7, API client, env configs
- `templates/auth/` — Cognito JWT Lambda authorizer with aws-jwt-verify, unit tests (11 cases)
- `templates/e2e/` — Playwright 1.58.2 config with 3-browser setup, webServer auto-start, home page spec
- `templates/infra/src/stacks/modules/auth-stack.ts.hbs` — CDK Cognito UserPool + UserPoolClient + Lambda authorizer
- `templates/infra/src/stacks/modules/frontend-stack.ts.hbs` — CDK S3 + CloudFront with OAC, SPA routing, security headers
- `templates/frontend/src/vite-env.d.ts` — Vite client types + SVG module declarations
- `src/scaffolder.ts` — Added "frontend", "auth", "e2e" to SUBDIR_TEMPLATE_DIRS
- `test/phase5-templates.test.ts` — 90 tests covering all Phase 5 template files

## Key APIs (for downstream tasks)

- `FrontendStack` — exports `distributionUrl`, CfnOutput: DistributionUrl, DistributionId, FrontendBucketName
- `AuthStack` — exports `userPool`, `userPoolClientId`, `authorizerFunctionArn`, CfnOutput: UserPoolId, UserPoolClientId, AuthorizerFunctionArn
- Frontend API client: `apiGet<T>()`, `apiPost<T>()`, `apiPut<T>()`, `apiDelete<T>()` from `shared/lib/api.ts`

## Patterns Established

- Frontend templates use `vite-env.d.ts` for Vite client types and SVG module declarations
- Auth authorizer uses module-scope verifier initialization for Lambda cold-start optimization
- E2E config uses `.hbs` extension when `{{projectName}}` is needed in non-standard files (playwright.config.ts.hbs)
- CloudFront uses `S3BucketOrigin.withOriginAccessControl()` (modern OAC, not deprecated OAI)
- CloudFront security headers via `ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_AND_SECURITY_HEADERS`
- Auth stack uses `this.config.lambdaMemoryMb` / `this.config.lambdaTimeoutSecs` (consistent with other stacks)

## Decisions Made

- S3 + CloudFront chosen over Amplify Hosting (Amplify L2 constructs are alpha/limited)
- E2E title test uses `/.+/` regex (generic) since `{{projectName}}` can't be substituted in non-.hbs files
- `autoDeleteObjects` only enabled in dev stage via `this.config.isDev`
- Playwright configured with 3 browsers (Chromium, Firefox, WebKit) but tests require `playwright install`

## Dependencies Added

- `react@19.2.4`, `react-dom@19.2.4` — frontend UI
- `react-router@7.13.1` — client-side routing
- `vite@7.3.1`, `@vitejs/plugin-react@5.1.4` — frontend build
- `aws-jwt-verify@5.1.1` — Cognito JWT validation in authorizer
- `@playwright/test@1.58.2` — e2e testing framework

## Known Limitations

- E2E tests require `pnpm exec playwright install` before first run (browser binaries not bundled)
- Frontend stack BucketDeployment resolves `frontend/dist` via relative path — requires frontend to be built first
- CloudFront SPA routing uses 403/404 → /index.html mapping (may mask actual errors in dev)
