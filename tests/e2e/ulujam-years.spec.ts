import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.use({ hasTouch: true });
test("2027 boş tarih, 2026 arşivi ve isteğe bağlı oyunlar", async ({
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
    archive.getByText("Henüz doğrulanmış arşiv görseli yok."),
  ).toBeVisible();
  await expect(archive.getByRole("img")).toHaveCount(0);
  await expect(
    archive.getByText("Finalist oyunları henüz yayımlanmadı."),
  ).toBeVisible();
  const star = page.getByRole("region", { name: "Yıldız yakalama" });
  await star.getByRole("button", { name: "Başlat", exact: true }).click();
  const target = star.getByRole("button", {
    name: "Yıldızı yakala",
    exact: true,
  });
  expect(await target.evaluate((e) => getComputedStyle(e).animationName)).toBe(
    "none",
  );
  await target.tap();
  await target.focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press("Enter");
  await expect(star.getByRole("status")).toContainText("5 / 5");
  await expect(target).toBeDisabled();
  const memory = page.getByRole("region", { name: "Hafıza eşleştirme" });
  await memory.getByRole("button", { name: "Başlat", exact: true }).click();
  await memory
    .getByRole("button", { name: "Kart 1: kapalı", exact: true })
    .tap();
  await memory
    .getByRole("button", { name: "Kart 5: kapalı", exact: true })
    .click();
  await memory
    .getByRole("button", { name: "Kart 2: kapalı", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await memory
    .getByRole("button", { name: "Kart 4: kapalı", exact: true })
    .click();
  await memory
    .getByRole("button", { name: "Kart 3: kapalı", exact: true })
    .click();
  await memory
    .getByRole("button", { name: "Kart 6: kapalı", exact: true })
    .click();
  await expect(memory.getByRole("status")).toContainText("3 / 3");
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
  await expect(page.getByRole("combobox", { name: "Arşiv medyası", exact: true })).toBeVisible();
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
