import { test as base, expect } from "@playwright/test";

/**
 * Base test fixture that extends Playwright's built-in `test` object.
 *
 * Add project-specific fixtures here — for example, a logged-in page,
 * an API client, or seeded database state — and they will be available
 * in every test file that imports from this module.
 *
 * @example
 * ```ts
 * // In a test file:
 * import { test, expect } from "./fixtures/base.js";
 *
 * test("my test", async ({ page, myFixture }) => { ... });
 * ```
 *
 * @see https://playwright.dev/docs/test-fixtures
 */

// Extend the base fixture type here as you add custom fixtures.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type Fixtures = {
  // Example: authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  // Add custom fixture implementations here.
  // Example:
  // authenticatedPage: async ({ page }, use) => {
  //   await page.goto("/login");
  //   await page.fill('[name="email"]', process.env["TEST_USER_EMAIL"]!);
  //   await page.fill('[name="password"]', process.env["TEST_USER_PASSWORD"]!);
  //   await page.click('[type="submit"]');
  //   await use(page);
  // },
});

export { expect };
