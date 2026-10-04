import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const width of [390, 1440])
  test(`yüklenen afişler ve başkan medyası ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/etkinlikler");
    const poster = page.getByRole("img", {
      name: "Uludott tanışma etkinliği — Coffee Talk afişi",
      exact: true,
    });
    await expect(poster).toBeVisible();
    const ratio = await poster.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.height / r.width;
    });
    expect(ratio).toBeCloseTo(1.25, 2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (await new AxeBuilder({ page }).include("main").analyze()).violations,
    ).toEqual([]);
    await page.goto("/duyurular");
    await expect(
      page.getByRole("img", {
        name: "Uludott Valorant turnuvası afişi",
        exact: true,
      }),
    ).toBeVisible();
    await page.goto("/hakkimizda");
    const chair = page.getByRole("region", {
      name: "Başkan Yiğit",
      exact: true,
    });
    await expect(chair.locator("video")).toHaveCount(1);
    await expect(chair.locator("video")).toHaveAttribute(
      "src",
      /baskan-yigit-acilis.mp4/,
    );
    await expect(chair.locator(".people-gallery img")).toHaveCount(1);
    await expect(chair.locator(".people-gallery img")).toHaveAttribute(
      "alt",
      /Yiğit detay fotoğrafı/,
    );
  });
