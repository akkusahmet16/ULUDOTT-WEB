import { defineConfig } from "@playwright/test";
import config from "./playwright.config.ts";

// Tarihli UluJam, diğer senaryoların tarihsiz 2027 sözleşmesini etkilememelidir.
// Bu ek koşu kendi izole DB'sini ve mevcut webServer düzeneğini kullanır.
export default defineConfig({ ...config, workers: 1, testMatch: ["cache-e2e/**/*.spec.ts"] });
