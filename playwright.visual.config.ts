import { defineConfig } from "@playwright/test";
import {
  VISUAL_BROWSER_ARGS,
  VISUAL_DEVICE_SCALE_FACTOR,
} from "./tests/helpers/visual-runtime.ts";

if (
  !process.env.ULUDOTT_VISUAL_RUN ||
  process.argv.some((arg) => arg.startsWith("--update-snapshots"))
)
  throw Error(
    "Run the guarded visual-cinematic script; baseline updates are forbidden here.",
  );

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "visual-cinematic.spec.ts",
  workers: 1,
  maxFailures: 0,
  retries: 0,
  forbidOnly: true,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  updateSnapshots: "none",
  outputDir: ".local/phase-0c/test-output",
  reporter: "line",
  use: {
    browserName: "chromium",
    channel: "chromium",
    headless: true,
    launchOptions: { args: [...VISUAL_BROWSER_ARGS] },
    baseURL: "https://127.0.0.1:3443",
    ignoreHTTPSErrors: true,
    deviceScaleFactor: VISUAL_DEVICE_SCALE_FACTOR,
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    colorScheme: "dark",
    forcedColors: "none",
    reducedMotion: "no-preference",
    isMobile: false,
    hasTouch: false,
    trace: "off",
    video: "off",
    screenshot: "off",
    actionTimeout: 10_000,
  },
});
