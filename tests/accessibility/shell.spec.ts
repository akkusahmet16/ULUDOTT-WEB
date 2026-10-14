import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { THEMES } from "../../src/config/theme.config.ts";
import { STORAGE_KEYS } from "../../src/config/storage-keys.ts";
for (const theme of THEMES)
for (const route of [
  "/",
  "/hakkimizda",
  "/ulujam",
  "/destek",
  "/admin",
  "/etkinlikler",
  "/duyurular",
  "/linkler",
  "/oyunlar",
])
  test(`axe ${theme} ${route}`, async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: STORAGE_KEYS.theme, value: theme });
    expect((await page.goto(route))?.status()).toBe(200);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
  });
