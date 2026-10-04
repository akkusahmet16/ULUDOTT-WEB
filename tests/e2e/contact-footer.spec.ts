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
    for (const [name, href] of [
      ["Instagram", "https://www.instagram.com/uludott"],
      [
        "WhatsApp",
        "https://chat.whatsapp.com/G9zI4u4FOEu8Cz5AhitkVS?s=cl&p=i&mlu=4&ilr=4",
      ],
      ["X", "https://x.com/uludott"],
      ["YouTube", "https://youtube.com/@uludott"],
    ]) {
      const link = social.getByRole("link", { name, exact: true });
      await expect(link).toHaveAttribute("href", href);
      await expect(link).toHaveAttribute("rel", /noopener/);
      await expect
        .poll(() =>
          link
            .locator("img")
            .evaluate((image: HTMLImageElement) => image.naturalWidth),
        )
        .toBeGreaterThan(0);
    }
    await expect(social.locator(".social-pending")).toHaveCount(0);
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
