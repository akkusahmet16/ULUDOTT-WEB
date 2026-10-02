import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("UluJam dört mod ve beceriler; yalnız önizleme, parola temizlenir", async ({
  page,
}) => {
  await page.goto("/admin");
  await page.getByLabel("E-posta").fill("admin-e2e@test.invalid");
  await page
    .getByLabel("Parola", { exact: true })
    .fill("E2E-only-password-long-42");
  await page
    .getByLabel("Doğrulama veya kurtarma kodu")
    .fill("99999999999999999999999999999999");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();
  await page.goto("/admin/formlar");
  await page
    .getByRole("link", { name: /UluJam 2027.*özel form önizlemesi/ })
    .click();
  await expect(page.getByText("Bu önizleme başvuru kaydetmez.")).toBeVisible();
  await expect(page.getByLabel(/Oyuncu adı|Takma ad/)).toHaveCount(0);
  await page.getByLabel("Ad soyad *").fill("DEMO kişi");
  await page.getByLabel("E-posta *").fill("demo@test.invalid");
  await page.getByLabel("Telefon *").fill("+905551234567");
  await page.getByLabel("Tek başına katılıyorum", { exact: true }).check();
  await page.getByLabel("Yazılım", { exact: true }).check();
  await page.getByLabel("Yazılım seviyesi *").fill("3");
  await expect(page.getByLabel("Becerilerinizin açıklaması *")).toHaveCount(0);
  const check = page.getByRole("button", {
    name: "Alanları kontrol et",
    exact: true,
  });
  await check.click();
  await expect(page.getByRole("status")).toHaveText(
    "Önizleme doğrulandı; başvuru kaydedilmedi.",
  );
  await page.getByLabel("Görsel sanat", { exact: true }).check();
  await page.getByLabel("Görsel sanat seviyesi *").fill("5");
  await expect(page.getByLabel("Becerilerinizin açıklaması *")).toBeVisible();
  await check.click();
  await expect(page.getByRole("status")).not.toHaveText(
    "Önizleme doğrulandı; başvuru kaydedilmedi.",
  );
  await page
    .getByLabel("Becerilerinizin açıklaması *")
    .fill("DEMO yazılım ve çizim");
  await check.click();
  await expect(page.getByRole("status")).toHaveText(
    "Önizleme doğrulandı; başvuru kaydedilmedi.",
  );
  await page.getByLabel("Takım arıyorum", { exact: true }).check();
  await expect(page.getByLabel("Takım adı *")).toHaveCount(0);
  await check.click();
  await expect(page.getByRole("status")).toHaveText(
    "Önizleme doğrulandı; başvuru kaydedilmedi.",
  );
  await page.getByLabel("Yeni takım kuruyorum", { exact: true }).check();
  await page.getByLabel("Takım adı *").fill("DEMO yeni takım");
  await page.getByLabel("Beklenen toplam kişi sayısı *").fill("3");
  await check.click();
  await expect(page.getByRole("status")).toHaveText(
    "Önizleme doğrulandı; başvuru kaydedilmedi.",
  );
  await page.getByLabel("Mevcut takıma katılıyorum", { exact: true }).check();
  await expect(page.getByLabel("Takım adı *")).toHaveCount(0);
  await page
    .getByLabel("Katılacağınız takım *")
    .selectOption({ label: "DEMO önizleme takımı" });
  await page.getByLabel("Takım parolası *").fill("DEMO-private-42");
  await check.click();
  await expect(page.getByRole("status")).toHaveText(
    "Önizleme doğrulandı; başvuru kaydedilmedi.",
  );
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
  await page.getByLabel("Tek başına katılıyorum", { exact: true }).check();
  await page.getByLabel("Mevcut takıma katılıyorum", { exact: true }).check();
  await expect(page.getByLabel("Takım parolası *")).toHaveValue("");
  await expect(page.getByLabel("Katılacağınız takım *")).toHaveValue("");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel("Tek başına katılıyorum", { exact: true }).check();
  await page.getByLabel("Görsel sanat", { exact: true }).uncheck();
  await expect(page.getByLabel("Görsel sanat seviyesi *")).toHaveCount(0);
  await expect(page.getByLabel("Becerilerinizin açıklaması *")).toHaveCount(0);
  await page.getByLabel("Yazılım", { exact: true }).uncheck();
  await check.click();
  await expect(page.getByRole("status")).toHaveText(/kontrol edin/);
});
test("UluJam önizlemesi anonim kullanıcıya açılmaz", async ({ page }) => {
  await page.goto("/admin/ulujam-formu/90202700-0000-4000-8000-000000000001");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByLabel("Telefon *")).toHaveCount(0);
});
