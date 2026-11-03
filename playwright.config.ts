import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  testMatch: ["e2e/**/*.spec.ts", "accessibility/**/*.spec.ts"],
  testIgnore: "**/visual-cinematic.spec.ts",
  use: {
    baseURL:
      process.env.ULUDOTT_E2E_PRODUCTION === "1"
        ? "https://127.0.0.1:3443"
        : "http://127.0.0.1:3100",
    ignoreHTTPSErrors: process.env.ULUDOTT_E2E_PRODUCTION === "1",
  },
  webServer: {
    command:
      "pnpm exec node --conditions=react-server tests/helpers/start-e2e.ts",
    url:
      process.env.ULUDOTT_E2E_PRODUCTION === "1"
        ? "https://127.0.0.1:3443"
        : "http://127.0.0.1:3100",
    ignoreHTTPSErrors: process.env.ULUDOTT_E2E_PRODUCTION === "1",
    reuseExistingServer: false,
    // S3 cleanup alone allows 20s; keep teardown longer than one delete.
    gracefulShutdown: { signal: "SIGTERM", timeout: 60_000 },
    timeout: 60_000,
  },
});
