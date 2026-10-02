import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["e2e/**/*.spec.ts", "accessibility/**/*.spec.ts"],
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
    gracefulShutdown: { signal: "SIGTERM", timeout: 10_000 },
    timeout: 60_000,
  },
});
