import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("Mobil bireysel kart pending/active/revoked ve özel erişim başlıkları", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/basvuru/e2e-ulujam");
  await page.getByLabel("Ad soyad *").fill("DEMO kart sahibi");
  await page.getByLabel("E-posta *").fill("card-e2e@test.invalid");
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
  await link.click();
  await expect(page.getByText("Kart durumu: Onay bekliyor")).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Etkinlik giriş QR kodu" }),
  ).toHaveCount(0);
  const res = await request.get(url);
  expect(res.headers()["cache-control"]).toContain("no-store");
  expect(res.headers()["referrer-policy"]).toBe("no-referrer");
  expect(res.headers()["x-robots-tag"]).toContain("noindex");
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await page.getByRole("link", { name: "Takım onayları", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Etkinlik", exact: true })
    .selectOption({ label: "DEMO UluJam başvuru" });
  await page.getByRole("button", { name: "Kuyruğu getir" }).click();
  const owner = page.getByRole("article", {
    name: "DEMO kart sahibi",
    exact: true,
  });
  await owner.getByRole("button", { name: "Onayla", exact: true }).click();
  await expect(owner).toContainText("approved");
  await page.goto(url);
  await expect(page.getByText("Kart durumu: Aktif")).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Etkinlik giriş QR kodu" }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".local/task19-card-mobile.png",
    fullPage: true,
  });
  await page.goto("/admin/takim-onaylari");
  await page
    .getByRole("combobox", { name: "Etkinlik", exact: true })
    .selectOption({ label: "DEMO UluJam başvuru" });
  await page.getByRole("button", { name: "Kuyruğu getir" }).click();
  await owner.getByLabel("Karar gerekçesi").fill("DEMO iptal");
  await owner.getByRole("button", { name: "Reddet", exact: true }).click();
  await expect(owner).toContainText("rejected");
  await page.goto(url);
  await expect(page.getByText("Kart durumu: İptal")).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Etkinlik giriş QR kodu" }),
  ).toHaveCount(0);
  expect(await page.locator("main").innerText()).not.toContain(
    "card-e2e@test.invalid",
  );
});
test("Check-in yazma CSRF, private kart rastgele adres reddi", async ({
  request,
}) => {
  expect((await request.post("/api/admin/check-in")).status()).toBe(403);
  expect((await request.get("/kart/" + "x".repeat(43))).status()).toBe(404);
});
