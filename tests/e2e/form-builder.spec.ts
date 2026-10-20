import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("form oluşturma, klavye alanları, önizleme ve sürümlü yayın", async ({
  page,
}) => {
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();
  await page.goto("/admin/formlar");
  await page
    .getByRole("combobox", { name: "Etkinlik", exact: true })
    .selectOption("c0ffee00-0000-4000-8000-000000000014");
  await page.getByLabel("Soru / alan başlığı").fill("İletişim");
  await page.getByLabel("Yanıt türü").selectOption("email");
  await page.getByLabel("Form başlığı").fill("E2E form");
  await page.getByLabel("Form adresi").fill("e2e-builder");
  await page.getByLabel("Başlangıç (İstanbul)").fill("2020-01-01T12:00");
  await page.getByLabel("Teşekkür metni").fill("Test başvurusu alındı.");
  await page
    .getByRole("button", { name: "Ayarları kaydet", exact: true })
    .click();
  await expect(page).toHaveURL(/admin\/formlar\/[^/]+$/);
  await page.getByLabel("Alan türü").selectOption("dropdown");
  await page.getByLabel("1. seçenek", { exact: true }).fill("Birinci");
  await page.getByRole("button", { name: "Seçenek ekle", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.getByLabel("2. seçenek", { exact: true }).fill("İkinci");
  await page
    .getByRole("button", { name: "Alanları kaydet", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Kaydedildi.");
  await page.reload();
  await expect(page.getByLabel("1. seçenek", { exact: true })).toHaveValue(
    "Birinci",
  );
  await expect(page.getByLabel("2. seçenek", { exact: true })).toHaveValue(
    "İkinci",
  );
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

test("UluJam etkinliği için yeni gerçek form takım şablonuyla oluşturulur", async ({
  page,
}) => {
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();
  await page.goto("/admin/formlar");
  await page
    .getByRole("combobox", { name: "Etkinlik", exact: true })
    .selectOption("16000000-0000-4000-8000-000000000001");
  await expect(
    page.getByRole("region", { name: "UluJam başvuru şablonu", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Form başlığı").fill("E2E yeni UluJam formu");
  await page.getByLabel("Form adresi").fill("e2e-new-ulujam-builder");
  await page.getByLabel("Başlangıç (İstanbul)").fill("2020-01-01T12:00");
  await page.getByLabel("Teşekkür metni").fill("Başvuru alındı.");
  await page
    .getByRole("button", { name: "Ayarları kaydet", exact: true })
    .click();
  await expect(page).toHaveURL(/admin\/formlar\/[^/]+$/);
  await expect(
    page.getByRole("heading", { name: "E2E yeni UluJam formu", exact: true }),
  ).toBeVisible();
  const formId = page.url().split("/").at(-1);
  const saved = await (
    await page.request.get(`/api/admin/forms/${formId}`)
  ).json();
  expect(saved.status).toBe("draft");
  expect(saved.draft.definition.fields).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "15000000-0000-4000-8000-000000000004",
        options: expect.arrayContaining([
          { value: "new", label: "Yeni takım kuruyorum" },
        ]),
      }),
      expect.objectContaining({
        id: "15000000-0000-4000-8000-000000000007",
        condition: {
          op: "eq",
          fieldId: "15000000-0000-4000-8000-000000000004",
          value: "new",
        },
      }),
    ]),
  );
});
test("form API oturum/CSRF olmadan yazamaz", async ({ request }) => {
  expect((await request.post("/api/admin/forms", { data: {} })).status()).toBe(
    403,
  );
});
