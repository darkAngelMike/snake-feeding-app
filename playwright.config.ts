import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);
const baseURL = process.env.BASE_URL || "http://localhost:5173";
const apiBaseURL = process.env.API_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["allure-playwright", { outputFolder: "allure-results" }],
  ],
  webServer: [
    {
      command: "npm run start:backend",
      url: apiBaseURL,
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
    {
      command: "npm run start:frontend",
      url: baseURL,
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "api",
      testDir: "./tests/api",
      use: {
        baseURL: apiBaseURL,
      },
    },
    {
      name: "chromium",
      testDir: "./tests/e2e",
      use: {
        ...devices["Desktop Chrome"],
        baseURL,
      },
    },
    {
      name: "mobile-chromium",
      testDir: "./tests/e2e",
      use: {
        ...devices["Pixel 5"],
        baseURL,
      },
    },
  ],
});
