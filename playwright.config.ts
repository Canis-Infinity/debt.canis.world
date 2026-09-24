import { defineConfig, devices } from "@playwright/test"
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  use: { baseURL: "http://localhost:17345", trace: "retain-on-failure" },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: [
    {
      command: "node ../backend/scripts/debt-e2e-server.js",
      env: { DEBT_E2E: "1" },
      url: "http://localhost:17444/readyz",
      timeout: 180000,
      reuseExistingServer: false,
    },
    {
      command: "node node_modules/next/dist/bin/next start -p 17345",
      env: { INTERNAL_API_BASE_URL: "http://127.0.0.1:17444" },
      url: "http://localhost:17345/login",
      timeout: 120000,
      reuseExistingServer: false,
    },
  ],
})
