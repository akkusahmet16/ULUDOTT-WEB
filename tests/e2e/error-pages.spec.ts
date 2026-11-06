import { expect, test } from "@playwright/test";

test.describe("Faz 5 / İş 5A — Detay sayfaları, galeri ve hata yüzeyleri E2E", () => {
  const missingRoutes = [
    { path: "/olmayan-sayfa-404-test", label: "statik olmayan rota" },
    { path: "/etkinlikler/bilinmeyen-etkinlik-slug-404", label: "dinamik etkinlik 404" },
    { path: "/oyunlar/bilinmeyen-oyun-slug-404", label: "dinamik oyun 404" },
    { path: "/basvuru/olmayan-form-slug-404", label: "dinamik başvuru 404" },
    { path: "/kart/gecersiz-veya-olmayan-token-404", label: "özel token 404" },
  ];

  for (const { path, label } of missingRoutes) {
    test(`${label} (${path}) 404 status ve noindex politikası uygular, sunucu sırrı sızdırmaz`, async ({
      page,
    }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);

      // Meta robots veya HTTP x-robots-tag noindex içermelidir
      const robotsMeta = await page
        .locator('meta[name="robots"]')
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("content") ?? "").join(","),
        );
      const robotsHeader = response?.headers()["x-robots-tag"] ?? "";
      expect(robotsMeta + " " + robotsHeader).toMatch(/noindex/i);

      // Sır sızdırmama ve yığın izi bulunmama güvencesi
      const content = await page.content();
      expect(content).not.toContain("DATABASE_URL");
      expect(content).not.toContain("postgres://");
      expect(content).not.toContain("SESSION_SECRET");
      expect(content).not.toContain("node_modules");
      expect(content).not.toContain("/Users/");
      expect(content).not.toContain("/home/");
      expect(content).not.toContain("webpack-internal");
      expect(content).not.toMatch(/at\s+[a-zA-Z0-9_.]+\s+\(.*:[0-9]+:[0-9]+\)/);
    });
  }

  test("UluJam arşiv galeri mozaik düzeni v0.1 sözleşmesini korur ve Issue #1 lightbox bileşenini kesinlikle içermez", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const response = await page.goto("/ulujam");
    expect(response?.status()).toBe(200);

    const archive = page.getByRole("region", { name: "UluJam 2026 arşivi" });
    await expect(archive).toBeVisible();

    const archiveGallery = archive.getByRole("region", {
      name: "Arşiv galerisi",
    });
    await expect(archiveGallery).toBeVisible();

    // Galeri mozaik düzeni
    const mosaic = archiveGallery.locator(".archive-gallery-mosaic");
    await expect(mosaic).toBeVisible();

    const items = mosaic.locator("figure.archive-gallery-item");
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // 1. görsel featured, sonraki görseller side
    await expect(items.nth(0)).toHaveClass(/archive-gallery-featured/);
    if (count > 1) {
      await expect(items.nth(1)).toHaveClass(/archive-gallery-side/);
    }

    // Figcaption ve eyebrow
    const firstFigcaption = items.nth(0).locator("figcaption");
    await expect(firstFigcaption).toBeVisible();
    await expect(firstFigcaption.locator(".eyebrow")).toContainText("UluJam 2026 / 01");

    // Issue #1 Yeni Lightbox Yokluğu Kontrolü (Görsel Kilit / Açık Fark Sözleşmesi):
    // v0.1'de lightbox bulunmamaktadır; hiçbir modal diyalog veya popup açılmamalıdır
    await expect(page.locator(".lightbox")).toHaveCount(0);
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await expect(page.locator('[aria-modal="true"]')).toHaveCount(0);

    // İlk görsele tıklandığında sayfa yeni bir katman açmamalıdır
    await items.nth(0).click();
    await expect(page.locator(".lightbox")).toHaveCount(0);
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await expect(page.locator('[aria-modal="true"]')).toHaveCount(0);
  });

  test("Admin yetkisiz istekler temiz hata kodu döner ve sunucu verisi sızdırmaz", async ({
    request,
  }) => {
    const sessionRes = await request.get("/api/admin/session");
    expect(sessionRes.status()).toBe(401);
    const body = await sessionRes.text();
    expect(body).not.toContain("token");
    expect(body).not.toContain("DATABASE_URL");
    expect(body).not.toContain("postgres://");
    expect(body).not.toContain("node_modules");
  });
});
