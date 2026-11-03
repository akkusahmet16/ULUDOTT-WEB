import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.use({ hasTouch: true });
test("2027 boş tarih, 2026 arşivi ve mini oyunların kaldırılması", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ulujam");
  const future = page.getByRole("region", { name: "UluJam 2027" });
  await expect(future.getByText("Yakında", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Etkinliğe kalan süre")).toHaveCount(0);
  await expect(future.getByRole("link")).toHaveCount(0);
  const archive = page.getByRole("region", { name: "UluJam 2026 arşivi" });
  await expect(archive.getByRole("article")).toHaveCount(3);
  await expect(
    archive.getByText("UluJam 2026 — topluluktan kare 1"),
  ).toBeVisible();
  await expect(archive.getByRole("img")).toHaveCount(6);
  const archiveGallery = archive.getByRole("region", {
    name: "Arşiv galerisi",
  });
  const galleryItems = archiveGallery.locator("figure");
  await expect(galleryItems.nth(0)).toHaveClass(/archive-gallery-featured/);
  await expect(galleryItems.nth(1)).toHaveClass(/archive-gallery-side/);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(galleryItems.nth(0)).toHaveCSS("grid-row-start", "1");
  await expect(galleryItems.nth(0)).toHaveCSS("grid-row-end", "span 2");
  await page.setViewportSize({ width: 390, height: 900 });
  for (const title of ["Lost Pieces", "Lost Child Soul", "ProjectSW"])
    await expect(archive.getByRole("heading", { name: title })).toBeVisible();
  await expect(archive.getByText("Finalistler", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    archive.getByText("Finalist oyunları henüz yayımlanmadı.", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".game-break")).toHaveCount(0);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("main").focus();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: ".local/task9-mobile.png", fullPage: true });
});
test("galeri API yetkisiz mutasyonu reddeder", async ({ request }) => {
  expect((await request.post("/api/admin/gallery")).status()).toBe(403);
});

test("eski galeri adresi güncel arşiv düzenleyiciye gider; klasör fotoğrafı taslakta kalıcıdır", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();
  await page.goto("/admin/galeri");
  await expect(page).toHaveURL(/\/admin\/ulujam-arsivleri$/);
  const editor = page.getByRole("region", {
    name: "UluJam arşiv düzenleyici",
    exact: true,
  });
  await editor
    .getByRole("button", { name: "Yeni arşiv ekle", exact: true })
    .click();
  await editor.getByLabel("Arşiv yılı", { exact: true }).fill("2025");
  await editor
    .getByLabel("Arşiv açıklaması", { exact: true })
    .fill("DEMO E2E taslak arşiv; gerçek tarihî kayıt değildir.");
  await editor
    .getByRole("button", { name: "Fotoğraf ekle", exact: true })
    .click();
  const photo = editor.getByRole("group", {
    name: "1. arşiv fotoğrafı",
    exact: true,
  });
  await photo.getByText("Klasörden görsel seç", { exact: true }).click();
  const asset = photo.getByRole("button", {
    name: "ulujam-2026-galeri-01.webp",
    exact: true,
  });
  await expect(asset).toBeVisible();
  await asset.click();
  await editor
    .getByLabel("Fotoğraf açıklaması", { exact: true })
    .fill("DEMO taslak fotoğrafı");
  const saved = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/admin/ulujam-archives") &&
      r.request().method() === "POST",
  );
  await editor
    .getByRole("button", { name: "Taslağı kaydet", exact: true })
    .click();
  expect((await saved).ok()).toBe(true);
  await expect(editor.getByRole("status")).toHaveText(
    "Arşiv taslak olarak kaydedildi. Sitede görünmez.",
  );
  await page.reload();
  await editor
    .getByRole("button", { name: "UluJam 2025 düzenle", exact: true })
    .click();
  await expect(
    editor.getByLabel("Fotoğraf açıklaması", { exact: true }),
  ).toHaveValue("DEMO taslak fotoğrafı");
  await expect(
    photo.getByRole("img", {
      name: "1. arşiv fotoğrafı önizlemesi",
      exact: true,
    }),
  ).toHaveAttribute(
    "src",
    "/community/02-ulujam/2026-arsiv/ulujam-2026-galeri-01.webp",
  );
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/ulujam");
  await expect(
    page.getByRole("region", { name: "UluJam 2025 arşivi", exact: true }),
  ).toHaveCount(0);
});
