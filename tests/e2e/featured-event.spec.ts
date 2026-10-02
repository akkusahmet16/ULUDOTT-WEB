import { test, expect, type Page } from "@playwright/test";
import sharp from "sharp";
import AxeBuilder from "@axe-core/playwright";
async function login(page: Page, code: string) {
  await page.goto("/admin");
  await page.getByLabel("E-posta").fill("admin-e2e@test.invalid");
  await page
    .getByLabel("Parola", { exact: true })
    .fill("E2E-only-password-long-42");
  await page.getByLabel("Doğrulama veya kurtarma kodu").fill(code);
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();
}
async function authHeaders(page: Page) {
  const csrf = await page.evaluate(async () =>
    (await fetch("/api/admin/csrf", { cache: "no-store" })).json(),
  );
  return {
    "x-csrf-token": csrf.csrfToken as string,
    Origin: new URL(page.url()).origin,
    Cookie: (await page.context().cookies())
      .map((c) => `${c.name}=${c.value}`)
      .join("; "),
  };
}
async function mutate(page: Page, path: string, data: unknown) {
  return page.request.post(path, { headers: await authHeaders(page), data });
}
test("Coffee Talk taslak kalır; doğrulanmış afiş ve tarih sonrası ana sayfada görünür, başvuru CTA yok", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await login(page, "22222222222222222222222222222222");
  const image = await sharp({
    create: { width: 640, height: 360, channels: 3, background: "#b7a0ff" },
  })
    .png()
    .toBuffer();
  const putFixture = async () =>
    page.request.post("/api/admin/media", {
      headers: await authHeaders(page),
      multipart: {
        file: { name: "test.png", mimeType: "image/png", buffer: image },
        purpose: "poster",
        altText: "Sentetik test afişi",
      },
    });
  let upload = await putFixture();
  for (let attempt = 0; upload.status() === 429 && attempt < 5; attempt++) {
    await page.waitForTimeout(300);
    upload = await putFixture();
  }
  expect(upload.status()).toBe(201);
  const { id: mediaId } = await upload.json();
  expect(
    (
      await mutate(page, "/api/admin/media", {
        action: "publish",
        assetId: mediaId,
        confirmed: true,
      })
    ).ok(),
  ).toBe(true);
  await page.goto("/admin/etkinlikler");
  await page
    .getByLabel("Başlık", { exact: true })
    .fill("Coffee Talk test taslağı");
  await page.getByLabel("Slug", { exact: true }).fill("coffee-talk-test");
  await page
    .getByRole("button", { name: "Taslağı kaydet", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Kaydedildi");
  const card = page.getByRole("article").filter({
    has: page.getByRole("heading", {
      name: "Coffee Talk test taslağı",
      exact: true,
    }),
  });
  await card.getByRole("button", { name: "Düzenle", exact: true }).click();
  await page
    .getByRole("button", { name: "Yayın etkisini göster", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Yayını onayla", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("tarih ve konum");
  await page.keyboard.press("Escape");
  expect(
    (await page.request.get("/etkinlikler/coffee-talk-test")).status(),
  ).toBe(404);
  await page.getByLabel("Başlangıç (İstanbul)").fill("2030-01-02T15:00");
  await page.getByLabel("Bitiş (İstanbul)").fill("2030-01-02T17:00");
  await page.getByLabel("Konum", { exact: true }).fill("Yalnız test konumu");
  await page.getByLabel("Ana sayfa sırası").fill("0");
  await page.getByLabel("Afiş").selectOption(mediaId);
  await page.getByRole("button", { name: "Değişiklikleri kaydet" }).click();
  await expect(page.getByRole("status")).toContainText("Kaydedildi");
  await page.getByRole("button", { name: "Önizleme", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "İçerik önizleme" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .getByRole("region", { name: "İçerik önizleme" })
        .getByRole("img")
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({ path: ".local/task6-editor-mobile.png" });

  await page
    .getByRole("button", { name: "Yayın etkisini göster", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Yayını onayla", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Yayın güncellendi");
  await page.keyboard.press("Escape");
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Coffee Talk test taslağı",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Sentetik test afişi" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Başvur/ })).toHaveCount(0);
  await page
    .getByRole("link", { name: "Etkinlik ayrıntıları", exact: true })
    .click();
  await expect(page.getByText(/2 Ocak 2030.*15:00/)).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: ".local/task6-event-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".local/task6-event-desktop.png",
    fullPage: true,
  });
});
test("duyuru metni HTML çalıştırmaz, slug yönlenir ve arşiv public erişimi kaldırır", async ({
  page,
}) => {
  await login(page, "33333333333333333333333333333333");
  await page.goto("/admin/duyurular");
  await page.getByLabel("Başlık", { exact: true }).fill("Test duyurusu");
  await page.getByLabel("Slug", { exact: true }).fill("test-duyuru");
  await page
    .getByLabel("İçerik", { exact: true })
    .fill("<script>window.bad=true</script>");
  await page.getByLabel("SEO başlığı").fill("Özel paylaşım başlığı");
  await page
    .getByRole("button", { name: "Taslağı kaydet", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Kaydedildi");
  const card = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: "Test duyurusu", exact: true }),
  });
  await card.getByRole("button", { name: "Düzenle", exact: true }).click();
  await page
    .getByRole("button", { name: "Yayın etkisini göster", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Yayını onayla", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Yayın güncellendi");
  await page.keyboard.press("Escape");
  await page.goto("/duyurular/test-duyuru");
  await expect(
    page.getByText("<script>window.bad=true</script>", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Özel paylaşım başlığı");
  expect(await page.evaluate(() => Object.hasOwn(window, "bad"))).toBe(false);
  const items = await (
    await page.request.get("/api/admin/announcements", {
      headers: await authHeaders(page),
    })
  ).json();
  const a = items.items.find((x: { slug: string }) => x.slug === "test-duyuru");
  const saved = await mutate(page, "/api/admin/announcements", {
    action: "save",
    id: a.id,
    expectedRevision: a.revision,
    input: {
      title: a.title,
      slug: "test-duyuru-yeni",
      body: a.body,
      seo: a.seo,
    },
  });
  expect(saved.ok()).toBe(true);
  const updated = await saved.json();
  const redirect = await page.request.get("/duyurular/test-duyuru", {
    maxRedirects: 0,
  });
  expect(redirect.status()).toBe(308);
  expect(redirect.headers().location).toContain("test-duyuru-yeni");
  expect(
    (
      await mutate(page, "/api/admin/announcements", {
        action: "archive",
        id: a.id,
        expectedRevision: updated.revision,
        confirmed: true,
      })
    ).ok(),
  ).toBe(true);
  expect((await page.request.get("/duyurular/test-duyuru")).status()).toBe(404);
});
test("yayın API yetkisiz mutasyonları reddeder", async ({ request }) => {
  for (const route of ["events", "announcements"]) {
    expect((await request.get(`/api/admin/${route}`)).status()).toBe(401);
    expect((await request.post(`/api/admin/${route}`)).status()).toBe(403);
  }
});
