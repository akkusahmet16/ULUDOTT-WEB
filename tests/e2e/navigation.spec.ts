import { test, expect } from "@playwright/test";
for (const width of [390, 768, 1440])
  test(`genel gezinme ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "İçeriğe geç" })).toBeFocused();
    if (width >= 700)
      await expect(page.getByRole("button", { name: "Menü" })).toBeHidden();
    if (width < 700) {
      const menu = page.getByRole("button", { name: "Menü" });
      await menu.click();
      await expect(menu).toHaveAttribute("aria-expanded", "true");
    }
    await page
      .getByRole("navigation", { name: "Ana menü" })
      .getByRole("link", { name: "Hakkımızda" })
      .click();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Birlikte öğren. Birlikte üret.",
      }),
    ).toBeVisible();
    for (const route of ["/", "/hakkimizda", "/ulujam", "/destek"]) {
      const r = await page.goto(route);
      expect(r?.status()).toBe(200);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.goto("/");
    await page.screenshot({
      path: `.local/task4-${width}.png`,
      fullPage: true,
    });
    await page.goto("/ulujam");
    await expect(
      page.getByText("Başvurular henüz açılmadı.", { exact: false }),
    ).toBeVisible();
    expect(await page.locator('a[href="#"]').count()).toBe(0);
  });
test("ana sayfa CTA hedefleri ve logo geçerli", async ({ page }) => {
  await page.goto("/");
  for (const label of ["Topluluğu tanı", "UluJam’i keşfet", "Destek ol"]) {
    const link = page.getByRole("main").getByRole("link", { name: label });
    const url = await link.getAttribute("href");
    expect((await page.request.get(url!)).status()).toBe(200);
  }
  await expect(
    page.getByRole("banner").getByRole("img", { name: "Uludott" }),
  ).toBeVisible();
});
