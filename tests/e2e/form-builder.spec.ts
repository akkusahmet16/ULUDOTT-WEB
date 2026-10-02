import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("form oluşturma, klavye alanları, önizleme ve sürümlü yayın", async ({
  page,
}) => {
  await page.goto("/admin");
  await page.getByLabel("E-posta").fill("admin-e2e@test.invalid");
  await page
    .getByLabel("Parola", { exact: true })
    .fill("E2E-only-password-long-42");
  await page
    .getByLabel("Doğrulama veya kurtarma kodu")
    .fill("66666666666666666666666666666666");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();
  await page.goto("/admin/formlar");
  await page.getByLabel("Form başlığı").fill("E2E form");
  await page.getByLabel("Form adresi").fill("e2e-builder");
  await page.getByLabel("Başlangıç (İstanbul)").fill("2020-01-01T12:00");
  await page.getByLabel("Teşekkür metni").fill("Test başvurusu alındı.");
  await page
    .getByRole("button", { name: "Ayarları kaydet", exact: true })
    .click();
  await expect(page).toHaveURL(/admin\/formlar\/[^/]+$/);
  await page.getByRole("button", { name: "Alan ekle", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.getByLabel("Alan etiketi").fill("İletişim");
  await page.getByLabel("Alan türü").selectOption("email");
  await page.getByLabel("Zorunlu alan").check();
  await page.getByLabel("Yardımcı metin").fill("Geçerli e-posta yazın.");
  const preview = page.getByRole("region", { name: "Taslak önizleme" });
  await expect(preview.getByLabel("İletişim *")).toBeVisible();
  await preview.getByRole("button", { name: "Mobil görünüm" }).click();
  await page
    .getByRole("button", { name: "Alanları kaydet", exact: true })
    .click();
  await expect(page.getByText("Durum: draft", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Yayımla / devam ettir" }).click();
  await expect(
    page.getByText("Durum: published", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Alan değişiklikleri yeni form sürümü", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Duraklat", exact: true }).click();
  await expect(page.getByText("Durum: paused", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Yayımla / devam ettir" }).click();
  await expect(
    page.getByText("Durum: published", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Kapat", exact: true }).click();
  await expect(page.getByText("Durum: closed", { exact: false })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 900 });
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("form API oturum/CSRF olmadan yazamaz", async ({ request }) => {
  expect((await request.post("/api/admin/forms", { data: {} })).status()).toBe(
    403,
  );
});
