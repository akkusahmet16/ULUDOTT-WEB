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
  await expect(archive.getByRole("img")).toHaveCount(3);
  await expect(
    archive.getByText("Finalist oyunları henüz yayımlanmadı."),
  ).toBeVisible();
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
  await page.getByLabel("E-posta").fill("admin-e2e@test.invalid");
  await page
    .getByLabel("Parola", { exact: true })
    .fill("E2E-only-password-long-42");
  await page
    .getByLabel("Doğrulama veya kurtarma kodu")
    .fill("55555555555555555555555555555555");
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
