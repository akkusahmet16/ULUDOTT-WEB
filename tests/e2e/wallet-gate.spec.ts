import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("Wallet gate denies direct pending API and shows explicit provider readiness after approval", async ({
  page,
}) => {
  await page.goto("/basvuru/e2e-ulujam");
  await page.getByLabel("Ad soyad *").fill("DEMO Wallet sahibi");
  await page.getByLabel("E-posta *").fill("wallet-e2e@test.invalid");
  await page.getByLabel("Telefon *").fill("+905551234567");
  await page.getByLabel("Yazılım", { exact: true }).check();
  await page.getByLabel("Yazılım seviyesi *").fill("3");
  await page.getByLabel("Tek başına katılıyorum", { exact: true }).check();
  await page
    .getByRole("button", { name: "Başvuruyu gönder", exact: true })
    .click();
  const link = page.getByRole("link", { name: "Bireysel kartımı aç" });
  await expect(link).toBeVisible();
  const url = (await link.getAttribute("href"))!;
  const token = url.split("/").at(-1)!;
  await link.click();
  await expect(
    page.getByText("Wallet için katılım onayı bekleniyor."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Google Wallet’a ekle" }),
  ).toHaveCount(0);
  const denied = await page.evaluate(async (cardToken) => {
    const c = await fetch("/api/admin/csrf");
    const { csrfToken } = await c.json();
    const r = await fetch("/api/wallet/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({
        cardToken,
        provider: "google",
        action: "request",
      }),
    });
    return { status: r.status, cache: r.headers.get("cache-control") };
  }, token);
  expect(denied.status).toBe(403);
  expect(denied.cache).toContain("no-store");
  await page.goto("/admin");
  await page.getByLabel("E-posta").fill("admin-e2e@test.invalid");
  await page
    .getByLabel("Parola", { exact: true })
    .fill("E2E-only-password-long-42");
  await page
    .getByLabel("Doğrulama veya kurtarma kodu")
    .fill("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await page.getByRole("link", { name: "Takım onayları", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Etkinlik", exact: true })
    .selectOption({ label: "DEMO UluJam başvuru" });
  await page.getByRole("button", { name: "Kuyruğu getir" }).click();
  const owner = page.getByRole("article", {
    name: "DEMO Wallet sahibi",
    exact: true,
  });
  await owner.getByRole("button", { name: "Onayla", exact: true }).click();
  await expect(owner).toContainText("approved");
  await page.goto(url);
  await expect(page.getByText("Kart durumu: Aktif")).toBeVisible();
  await expect(
    page.getByText("Google Wallet: Hazır değil; sağlayıcı kimliği bekleniyor."),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Apple Wallet: Hazır değil; sertifika ve cihaz testi bekleniyor.",
    ),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
