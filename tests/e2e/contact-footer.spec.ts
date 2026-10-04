import { test, expect } from "@playwright/test";
for (const width of [390, 1440])
  test(`iletişim ve sosyal alt bölüm ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator('a[href="/linkler"]')).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Destek ol", exact: true }),
    ).toHaveCount(0);
    const social = page
      .getByRole("contentinfo")
      .getByRole("navigation", { name: "Sosyal medya" });
    await expect(social).toBeAttached();
    for (const name of ["YouTube", "WhatsApp", "Instagram"])
      await expect(social.getByText(name, { exact: true })).toBeAttached();
    await expect(social.locator('a[href="#"]')).toHaveCount(0);
    await page.getByRole("button", { name: "Menü", exact: true }).click();
    const menu = page.getByRole("navigation", { name: "Ana menü" });
    await expect(
      menu.getByRole("link", { name: "Bağlantılar", exact: true }),
    ).toHaveCount(0);
    await menu.getByRole("link", { name: "İletişim", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "İletişim", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".header-page-name")).toHaveText("İletişim");
    expect((await page.goto("/linkler"))?.status()).toBe(404);
  });
