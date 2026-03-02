import { test, expect } from "@playwright/test";

/**
 * End-to-end tests for the home page.
 *
 * These tests verify the core content that every visitor sees when they first
 * land on the application. Update the assertions here whenever the home page
 * content changes in `frontend/src/features/home/HomePage.tsx`.
 */
test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has correct page title", async ({ page }) => {
    // The title comes from index.html — update this assertion if you change it.
    await expect(page).toHaveTitle(/.+/);
  });

  test("displays the welcome heading", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "Welcome", level: 1 });
    await expect(heading).toBeVisible();
  });

  test("displays the getting-started subtitle", async ({ page }) => {
    const subtitle = page.getByText("Your AWS serverless app is ready.");
    await expect(subtitle).toBeVisible();
  });

  test("displays the app logo", async ({ page }) => {
    const logo = page.getByRole("img", { name: "App logo" });
    await expect(logo).toBeVisible();
  });

  test("is navigable from the root path", async ({ page }) => {
    // Verify we are on the root route — the URL should not redirect.
    await expect(page).toHaveURL("/");
  });
});
