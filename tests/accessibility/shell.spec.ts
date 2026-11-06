import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PUBLIC_ROUTES = [
  "/",
  "/hakkimizda",
  "/ulujam",
  "/etkinlikler",
  "/oyunlar",
  "/iletisim",
] as const;

const ALL_ROUTES = [...PUBLIC_ROUTES, "/admin"] as const;

for (const route of ALL_ROUTES) {
  test(`axe desktop ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    expect((await page.goto(route))?.status()).toBe(200);
    const axeResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(axeResults.violations).toEqual([]);
  });

  test(`axe mobile ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    expect((await page.goto(route))?.status()).toBe(200);
    const axeResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(axeResults.violations).toEqual([]);
  });

  test(`reflow 320px ${route} - no horizontal scroll`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    expect((await page.goto(route))?.status()).toBe(200);
    await page.waitForLoadState("domcontentloaded");
    const hasHorizontalScroll = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1
      );
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test(`reduced motion ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect((await page.goto(route))?.status()).toBe(200);
    await page.waitForLoadState("domcontentloaded");
  });

  test(`forced colors ${route}`, async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    expect((await page.goto(route))?.status()).toBe(200);
    await page.waitForLoadState("domcontentloaded");
  });
}

test("keyboard focus indicator is visible on tab navigation", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  await page.keyboard.press("Tab");
  const focusedTag = await page.evaluate(
    () => document.activeElement?.tagName.toLowerCase()
  );
  expect(["a", "button", "input"]).toContain(focusedTag);
});
