import { test, expect } from "@playwright/test";
import sharp from "sharp";
import AxeBuilder from "@axe-core/playwright";
test("mobil medya yükleme, özel önizleme, yayın ve silme etkisi", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/admin");
  await page.getByLabel("E-posta").fill("admin-e2e@test.invalid");
  await page
    .getByLabel("Parola", { exact: true })
    .fill("E2E-only-password-long-42");
  // Başka E2E de aynı admin ile TOTP tüketir; tek kullanımlık recovery bu akışı ayırır.
  await page
    .getByLabel("Doğrulama veya kurtarma kodu")
    .fill("11111111111111111111111111111111");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();
  await page.goto("/admin/medya");
  await page.getByLabel("Görsel dosyası").setInputFiles({
    name: "test.png",
    mimeType: "image/png",
    buffer: await sharp({
      create: { width: 640, height: 360, channels: 3, background: "#b7a0ff" },
    })
      .png()
      .toBuffer(),
  });
  await page.getByLabel("Alt metin").fill("Mor test görseli");
  // Seri medya işleyicisi başka fixture işlerken 429 beklenen yanıttır.
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = page.waitForResponse(
      (r) =>
        r.url().includes("/api/admin/media") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Yükle", exact: true }).click();
    const result = await response;
    if (result.status() !== 429) {
      expect(result.status()).toBe(201);
      break;
    }
    await expect(
      page.getByRole("button", { name: "Yükle", exact: true }),
    ).toBeEnabled();
    await page.waitForTimeout(300);
  }
  await expect(
    page.getByRole("heading", { name: "Mor test görseli" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Mor test görseli" }),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({ path: ".local/task5-mobile.png", fullPage: true });
  const card = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Mor test görseli" }) });
  await expect(card.getByText("Özel", { exact: true })).toBeVisible();
  await card.getByRole("button", { name: "Yayımla", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(
    card.getByRole("button", { name: "Yayımla", exact: true }),
  ).toBeFocused();
  await card.getByRole("button", { name: "Yayımla", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Türevleri yayımla" })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(card.getByText("Yayında", { exact: true })).toBeVisible();
  const url = await card
    .getByRole("link", { name: "Yayımlanan görsel" })
    .getAttribute("href");
  const r = await page.request.get(url!);
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toBe("image/webp");
  await card.getByRole("button", { name: "Silme etkisini göster" }).click();
  await expect(card.getByText("Bağlı içerik: 0")).toBeVisible();
  await card.getByRole("button", { name: "Silmeyi onayla" }).click();
  await expect(
    page.getByRole("heading", { name: "Mor test görseli" }),
  ).toHaveCount(0);
  expect((await page.request.get(url!)).status()).toBe(404);
});
test("medya API yetkisiz ve CSRF olmayan istekleri reddeder", async ({
  request,
}) => {
  expect((await request.get("/api/admin/media")).status()).toBe(401);
  expect((await request.post("/api/admin/media")).status()).toBe(403);
  expect((await request.get("/media/not-a-uuid")).status()).toBe(404);
});
