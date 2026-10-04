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

test("galeri yönetim slotları ve medya listesi erişilebilir", async ({
  page,
}) => {
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();
  await page.goto("/admin/galeri");
  await expect(
    page.getByRole("combobox", { name: "Arşiv medyası", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Galeri slotunu kaydet", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Galeri kaydedildi.");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});
