# Task: Create Playwright e2e test template

## ID
5.3

## Description
Create the `templates/e2e/` directory with Playwright configuration and example end-to-end tests. The e2e workspace is a separate root-level package that tests the full application in a browser.

## Dependencies
- Task 5.1: Frontend template (e2e tests target the frontend)

## Inputs
- E2E structure from PLAN.md
- Playwright configuration
- Variables: `{{projectName}}`

## Outputs / Deliverables
- `templates/e2e/package.json.hbs`
- `templates/e2e/playwright.config.ts`
- `templates/e2e/tests/home.spec.ts`
- `templates/e2e/tests/fixtures/` (placeholder or base fixture)

## Acceptance Criteria
- [ ] `playwright.config.ts` configured with base URL pointing to frontend dev server (localhost:5173)
- [ ] Example test navigates to home page and verifies basic content
- [ ] Config includes at least Chromium browser for testing
- [ ] `package.json` includes scripts: `test` (playwright test), `test:ui` (playwright test --ui)
- [ ] Tests use Playwright fixtures pattern
- [ ] Config has `webServer` option to auto-start frontend before tests (optional)

## Implementation Notes
- Keep e2e tests minimal -- just enough to demonstrate the pattern
- Use `@playwright/test` latest stable version
- The `webServer` config in playwright.config.ts can auto-start the dev servers before tests
- Consider adding a simple fixture for common test setup
- Tests should be resilient to minor UI changes (use data-testid attributes)

## Estimated Complexity
Low -- Standard Playwright setup with one example test

## Status
- [ ] Not Started
