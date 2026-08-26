import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const configuredBaseURL = process.env.PLAYWRIGHT_BASE_URL?.trim();
const baseURL = configuredBaseURL || "http://127.0.0.1:3000";
const startsLocalServer = !configuredBaseURL;

function hasClerkKey(kind: "pk" | "sk", value: string | undefined): boolean {
  return Boolean(
    value &&
    value.length >= 30 &&
    (value.startsWith(`${kind}_test_`) || value.startsWith(`${kind}_live_`)),
  );
}

if (
  startsLocalServer &&
  (!hasClerkKey("pk", process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) ||
    !hasClerkKey("sk", process.env.CLERK_SECRET_KEY))
) {
  throw new Error(
    "Local Playwright tests require valid Clerk keys in .env.local. Run ./setup.sh or pnpm setup:clerk first, or set PLAYWRIGHT_BASE_URL to test a configured deployment.",
  );
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: startsLocalServer
    ? {
        command: "pnpm dev:frontend",
        url: `${baseURL}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
