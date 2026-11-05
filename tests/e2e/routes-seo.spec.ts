import { expect, test } from "@playwright/test";
import {
  getStaticIndexableRoutes,
  LEGACY_UNIMPLEMENTED_ROUTES,
  NON_INDEXABLE_PREFIXES,
} from "../../src/config/routes.config.ts";

const staticPublicRoutes = getStaticIndexableRoutes();

test.describe("Faz 2 / İş 2B — Merkezi rota, metadata, canonical ve sitemap E2E", () => {
  for (const route of staticPublicRoutes) {
    test(`statik genel rota ${route.path} tek marka başlığı ve kanonik URL üretir`, async ({
      page,
    }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
      expect(response?.headers()["x-robots-tag"] ?? "").not.toMatch(/noindex/i);

      const title = await page.title();
      expect(title).toMatch(/\| ULUDOTT$/);
      expect(title).not.toMatch(/—\s*Uludott\s*\|\s*ULUDOTT/i);
      expect(title).not.toMatch(/^Uludott\s*—.*\|\s*ULUDOTT$/i);

      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      expect(
        new URL((await canonical.getAttribute("href")) ?? "").toString(),
      ).toBe(new URL(route.path, page.url()).toString());
    });
  }

  test("/oyunlar?cursor=... sorgusu ana liste kanonik URL'sini (/oyunlar) korur ve query sızdırmaz", async ({
    page,
  }) => {
    const response = await page.goto(
      "/oyunlar?cursor=00000000-0000-4000-8000-000000000001",
    );
    expect(response?.status()).toBe(200);
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    const href = (await canonical.getAttribute("href")) ?? "";
    expect(new URL(href).toString()).toBe(
      new URL("/oyunlar", page.url()).toString(),
    );
    expect(href).not.toContain("cursor=");
  });

  test("bulunamayan etkinlik ve oyun detayları 404 ve noindex döner", async ({
    page,
  }) => {
    for (const missingPath of [
      "/etkinlikler/olmayan-etkinlik-404",
      "/oyunlar/olmayan-oyun-404",
    ]) {
      const response = await page.goto(missingPath);
      expect(response?.status()).toBe(404);
      const robotsMeta = await page
        .locator('meta[name="robots"]')
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("content") ?? "").join(","),
        );
      expect(robotsMeta).toMatch(/noindex/i);
    }
  });

  test("özel/operasyonel rotalar HTTP ve meta noindex + no-referrer uygular, token sızdırmaz", async ({
    page,
  }) => {
    const secretToken = "cap-test-token-do-not-leak-987654";
    for (const privatePath of [
      "/makbuz",
      `/kart/${secretToken}`,
      `/takim/${secretToken}`,
      `/yayin-onayi/${secretToken}`,
    ]) {
      const response = await page.goto(privatePath);
      expect(response?.headers()["x-robots-tag"]).toMatch(/noindex/i);
      expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
      const canonicalCount = await page.locator('link[rel="canonical"]').count();
      expect(canonicalCount).toBe(0);
    }
  });

  test("robots.txt ve sitemap.xml merkezi NON_INDEXABLE_PREFIXES ve ROUTES sözleşmesini uygular", async ({
    request,
  }) => {
    const robotsRes = await request.get("/robots.txt");
    expect(robotsRes.status()).toBe(200);
    const robotsText = await robotsRes.text();
    expect(robotsText).toContain("Allow: /");
    for (const prefix of NON_INDEXABLE_PREFIXES) {
      expect(robotsText).toContain(`Disallow: ${prefix}`);
    }

    const sitemapRes = await request.get("/sitemap.xml");
    expect(sitemapRes.status()).toBe(200);
    const xml = await sitemapRes.text();

    for (const route of staticPublicRoutes) {
      expect(xml).toContain(new URL(route.path, sitemapRes.url()).toString());
    }
    for (const legacy of LEGACY_UNIMPLEMENTED_ROUTES) {
      expect(xml).not.toContain(
        `<loc>${new URL(legacy.path, sitemapRes.url()).toString()}</loc>`,
      );
    }
    expect(xml).not.toMatch(
      /<loc>[^<]*\/(?:admin|api|l|basvuru|makbuz|takim|kart|yayin-onayi)(?:\/|<)/,
    );
  });
});
