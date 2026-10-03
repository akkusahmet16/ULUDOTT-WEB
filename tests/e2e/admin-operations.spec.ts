import { test, expect, type Page } from "@playwright/test";
import { TOTP } from "otpauth";
async function login(page: Page, email = "admin-e2e@test.invalid") {
  await page.goto("/admin");
  await page.getByLabel("E-posta").fill(email);
  await page
    .getByLabel("Parola", { exact: true })
    .fill("E2E-only-password-long-42");
  await page
    .getByLabel("Doğrulama veya kurtarma kodu")
    .fill(
      email === "admin-e2e@test.invalid"
        ? "abababababababababababababababab"
        : new TOTP({ secret: "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP" }).generate(),
    );
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();
}
test("Mobile dashboard filters and critical retry preview/cancel/confirm use the real authenticated endpoint", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const nav = page.getByRole("navigation", { name: "Yönetim modülleri" });
  await expect(
    nav.getByRole("link", { name: "Formlar", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Operasyon özeti" }),
  ).toBeVisible();
  await page.getByLabel("Etkinlik veya form ara").fill("does-not-exist");
  await expect(page.getByText("Filtreye uygun etkinlik yok.")).toBeVisible();
  await page.getByLabel("Etkinlik veya form ara").fill("");
  await page.getByLabel("Özet filtresi").selectOption("upcoming");
  await expect(page.getByRole("article")).not.toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".local/task25-admin-mobile.png",
    fullPage: true,
  });
  await nav.getByRole("link", { name: "Sistem", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Sistem durumu" }),
  ).toBeVisible();
  let mutations = 0;
  await page.route("**/api/admin/outbox/*/retry", (route) => {
    mutations++;
    return route.continue();
  });
  const retry = page
    .getByRole("button", { name: "İşi yeniden dene", exact: true })
    .first();
  await retry.click();
  await expect(
    page.getByText("Tek bir başarısız iş kuyruğa geri alınacak."),
  ).toBeVisible();
  expect(mutations).toBe(0);
  await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
  expect(mutations).toBe(0);
  await retry.click();
  await page
    .getByRole("button", { name: "Onayla ve kuyruğa al", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "İş kuyruğa alındı." }),
  ).toBeVisible();
  expect(mutations).toBe(1);
  await expect(
    page.getByRole("button", { name: "İşi yeniden dene", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Operasyon özeti", exact: true }),
  ).toBeVisible();
});
test("Editor navigation and direct system URL withhold operations and personal metrics", async ({
  page,
}) => {
  await login(page, "editor-e2e@test.invalid");
  const nav = page.getByRole("navigation", { name: "Yönetim modülleri" });
  await expect(
    nav.getByRole("link", { name: "Duyurular", exact: true }),
  ).toBeVisible();
  await expect(
    nav.getByRole("link", { name: "Başvurular", exact: true }),
  ).toHaveCount(0);
  await expect(
    nav.getByRole("link", { name: "Sistem", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Yeni başvuru", { exact: true })).toHaveCount(0);
  await page.goto("/admin/sistem");
  await expect(page.getByRole("heading", { name: "Yetki yok" })).toBeVisible();
  await expect(page.getByText("Google Wallet", { exact: true })).toHaveCount(0);
  expect(
    (
      await page.request.post(
        "/api/admin/outbox/25000000-0000-4000-8000-000000000001/retry",
      )
    ).status(),
  ).toBe(403);
});
