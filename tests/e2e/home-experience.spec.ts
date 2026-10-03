import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const width of [390, 1440]) {
  test(`ana sayfa haritası ve doğrudan oyun molası ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const main = page.getByRole("main");
    for (const href of [
      "/hakkimizda",
      "/ulujam",
      "/etkinlikler",
      "/duyurular",
      "/oyunlar",
      "/linkler",
      "/destek",
    ]) {
      await expect(main.locator(`a[href="${href}"]`).first()).toBeVisible();
    }
    await expect(
      main.getByRole("button", { name: "Başlat", exact: true }),
    ).toHaveCount(0);
    const star = page.getByRole("region", { name: "Yıldız yakalama" });
    const target = star.getByRole("button", {
      name: "Yıldızı yakala",
      exact: true,
    });
    await expect(target).toBeVisible();
    await target.hover();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    for (let i = 0; i < 5; i++) await target.click();
    await expect(star.getByRole("status")).toContainText("5 / 5");
    await star.getByRole("button", { name: "Yeniden oyna" }).click();
    await expect(star.getByRole("status")).toContainText("0 / 5");
    const memory = page.getByRole("region", { name: "Hafıza eşleştirme" });
    for (const index of [1, 5, 2, 4, 3, 6])
      await memory
        .getByRole("button", { name: `Kart ${index}: kapalı`, exact: true })
        .click();
    await expect(memory.getByRole("status")).toContainText("3 / 3");
    await memory.getByRole("button", { name: "Yeniden oyna" }).click();
    await expect(memory.getByRole("status")).toContainText("0 / 3");
    await expect(page.getByRole("dialog")).toHaveCount(0);
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
