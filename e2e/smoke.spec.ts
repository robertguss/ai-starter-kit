import { expect, test } from "@playwright/test";

test("renders the public landing page", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Start with production-ready foundations.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Create account" }),
  ).toBeVisible();
});

test("returns a no-store health response", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.ok()).toBe(true);
  expect(response.headers()["cache-control"]).toContain("no-store");
  await expect(response.json()).resolves.toMatchObject({
    status: "ok",
    service: "web-app-starter-kit",
  });
});

test("redirects signed-out visitors away from the dashboard", async ({
  page,
}) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/sign-in(?:\/|\?|$)/);
});

test("renders the sign-in flow", async ({ page }) => {
  await page.goto("/sign-in");

  await expect(
    page.getByText("Web App Starter Kit", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
});

test("renders the application not-found page", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
});
