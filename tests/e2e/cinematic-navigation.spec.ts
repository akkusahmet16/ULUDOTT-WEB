import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const width of [390, 1440])
  test(`sinematik menü ve örnek içerikler ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(
      page.getByRole("navigation", { name: "Ana sayfa bölüm haritası" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Menü", exact: true }).click();
    const expand = page.getByRole("button", {
      name: "Topluluk alt menüsü",
      exact: true,
    });
    await expand.hover();
    expect(
      (await new AxeBuilder({ page }).include(".site-header").analyze())
        .violations,
    ).toEqual([]);
    await expand.click();
    const board = page
      .getByRole("navigation", { name: "Ana menü" })
      .getByRole("link", { name: "Yönetim kurulu", exact: true });
    await expect(board).toBeVisible();
    await board.click();
    await expect(page.locator("#yonetim-kurulu")).toBeVisible();
    await expect(page.locator("#mekanlar")).toBeAttached();
    await expect(
      page.getByText("Görsel yer tutucu", { exact: false }).first(),
    ).toBeVisible();
    await page.goto("/linkler");
    for (const name of ["YouTube", "WhatsApp", "Instagram"])
      await expect(
        page.getByRole("article", { name: `${name} örnek kutusu` }),
      ).toBeVisible();
    await expect(page.locator(".social-samples a")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test("normal hareketle kaydırılan mobil ana sayfa yatay taşmaz", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page
    .getByRole("region", { name: "Hafıza eşleştirme" })
    .scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(700);
  await expect
    .poll(() =>
      page
        .locator(".clone-opening img")
        .evaluate(
          (image) => new DOMMatrix(getComputedStyle(image).transform).a,
        ),
    )
    .toBeGreaterThan(1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
