import { test, expect, type Page } from "@playwright/test";
import sharp from "sharp";
import { openEventWithoutApplication } from "../helpers/event-card";
import AxeBuilder from "@axe-core/playwright";
async function login(page: Page) {
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
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
  await login(page);
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
  await openEventWithoutApplication(page, "Coffee Talk test taslağı");
  await expect(page.getByText(/2 Ocak 2030.*15:00/)).toBeVisible();
  await expect(page).toHaveTitle(/Coffee Talk test taslağı/);
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
test("kaldırılan duyuru yüzeyleri erişime kapalıdır", async ({ request }) => {
  for (const route of [
    "/duyurular",
    "/duyurular/test-duyuru",
    "/api/admin/announcements",
  ])
    expect((await request.get(route)).status()).toBe(404);
});
test("yayın API yetkisiz mutasyonları reddeder", async ({ request }) => {
  for (const route of ["events"]) {
    expect((await request.get(`/api/admin/${route}`)).status()).toBe(401);
    expect((await request.post(`/api/admin/${route}`)).status()).toBe(403);
  }
});
