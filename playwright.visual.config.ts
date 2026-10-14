import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "visual-classic.spec.ts",
  workers: 1,
  globalSetup: "./tests/helpers/visual-setup.ts",
  updateSnapshots: "none",
  snapshotPathTemplate: "{testDir}/__baseline-classic__/{arg}{ext}",
  use: {
    baseURL: "http://127.0.0.1:3200",
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    deviceScaleFactor: 1,
    colorScheme: "dark",
    reducedMotion: "reduce",
  },
});
