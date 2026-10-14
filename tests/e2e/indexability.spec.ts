import { expect, test } from "@playwright/test";

const publicPaths = ["/", "/hakkimizda", "/ulujam", "/etkinlikler", "/duyurular", "/oyunlar", "/linkler", "/destek"] as const;
for (const path of publicPaths) {
  test(`genel indeksleme ve kanonik ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-robots-tag"] ?? "").not.toMatch(/noindex/i);
    const robots = await page.locator('meta[name="robots"]').evaluateAll(nodes => nodes.map(node => node.getAttribute("content") ?? "").join(","));
    expect(robots ?? "").not.toMatch(/noindex/i);
    await expect(page).toHaveTitle(/\| ULUDOTT$/);
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    expect(new URL((await canonical.getAttribute("href")) ?? "").toString()).toBe(new URL(path, page.url()).toString());
  });
}

test("yönetim meta ve HTTP noindex koruması sürer", async ({ page, request }) => {
  const response = await page.goto("/admin");
  expect(response?.headers()["x-robots-tag"]).toMatch(/noindex/i);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
  const api = await request.get("/api/admin/session");
  expect(api.headers()["x-robots-tag"]).toMatch(/noindex/i);
});

test("robots ve sitemap genel rotaları açar, yönetimi ve taslak UluJam'i dışlar", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const text = await robots.text();
  expect(text).toContain("Allow: /");
  for (const path of ["/admin", "/api", "/l/"]) expect(text).toContain(`Disallow: ${path}`);
  expect(text).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  for (const path of publicPaths) expect(xml).toContain(new URL(path, sitemap.url()).toString());
  expect(xml).not.toMatch(/<loc>[^<]*\/(?:admin|api|l)(?:\/|<)/);
  expect(xml).not.toContain("/etkinlikler/ulujam-2027");
});
