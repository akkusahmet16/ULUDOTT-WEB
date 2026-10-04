import { test, expect } from "@playwright/test";
for (const width of [390, 768, 1440])
  test(`genel gezinme ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "İçeriğe geç" })).toBeFocused();
    const menu = page.getByRole("button", { name: "Menü", exact: true });
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    const navigation = page.getByRole("navigation", { name: "Ana menü" });
    await expect(navigation.getByRole("link")).toHaveCount(8);
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    await navigation.getByRole("link").last().focus();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Uludott ana sayfa" }),
    ).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(navigation.getByRole("link").last()).toBeFocused();
    await navigation.getByRole("link").first().focus();
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(navigation).toBeHidden();
    await menu.click();
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
    await expect(
      page.getByRole("heading", { level: 1, name: "Uludott" }),
    ).toHaveCSS("opacity", "1");
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
    const link = page
      .getByRole("main")
      .getByRole("link", { name: label, exact: true });
    const url = await link.getAttribute("href");
    expect((await page.request.get(url!)).status()).toBe(200);
  }
  await expect(
    page
      .getByRole("banner")
      .getByRole("link", { name: "Uludott ana sayfa" })
      .locator("img")
      .first(),
  ).toBeVisible();
});

test("hareket azaltıldığında içerik ve gezinme kullanılabilir", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const title = page.getByRole("heading", { level: 1, name: "Uludott" });
  await expect(title).toBeVisible();
  await expect(title).toHaveCSS("animation-name", "none");
  await expect(
    page
      .getByRole("main")
      .getByRole("link", { name: "Topluluğu tanı", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Menü", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Ana menü" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("kısa masaüstü ekranında menünün ilk ve son bağlantısı erişilebilir", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 400 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Menü", exact: true }).click();
  const navigation = page.getByRole("navigation", { name: "Ana menü" });
  const first = await navigation.getByRole("link").first().boundingBox();
  const header = await page.locator(".header-inner").boundingBox();
  expect(first!.y).toBeGreaterThanOrEqual(header!.height);
  await navigation.getByRole("link").last().scrollIntoViewIfNeeded();
  await expect(navigation.getByRole("link").last()).toBeInViewport();
});
