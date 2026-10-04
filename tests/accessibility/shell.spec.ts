import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const route of [
  "/",
  "/hakkimizda",
  "/ulujam",
  "/destek",
  "/admin",
  "/etkinlikler",
  "/duyurular",
  "/oyunlar",
])
  test(`axe ${route}`, async ({ page }) => {
    expect((await page.goto(route))?.status()).toBe(200);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
  });
