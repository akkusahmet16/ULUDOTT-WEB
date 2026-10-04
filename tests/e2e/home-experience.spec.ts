import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const width of [390, 1440]) {
  test(`ana sayfa panelleri ve mini oyunların kaldırılması ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const main = page.getByRole("main");
    await expect(
      page.getByRole("navigation", { name: "Ana sayfa bölüm haritası" }),
    ).toHaveCount(0);
    await expect(
      main.getByRole("button", { name: "Derece oyunlarını aç", exact: true }),
    ).toBeVisible();
    await expect(
      main.getByRole("button", { name: "Başlat", exact: true }),
    ).toHaveCount(0);
    await expect(page.locator(".game-break")).toHaveCount(0);
    await expect(page.locator(".header-page-name")).toHaveCount(0);
    const overflow = await page.evaluate(() =>
      Array.from(document.querySelectorAll("main *"))
        .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
        .map((e) => ({
          tag: e.tagName,
          cls: e.className,
          right: e.getBoundingClientRect().right,
          text: e.textContent?.slice(0, 25),
        }))
        .slice(0, 12),
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      JSON.stringify(overflow),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test("kısa yatay ekranda açılış eylemleri satırın içinde kalır", async ({
  page,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const row = page.locator(".clone-opening > div").nth(1);
  const bounds = (await row.boundingBox())!;
  for (const child of await row.locator(":scope > *").all()) {
    const box = (await child.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(bounds.x - 1);
    expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
  }
});
