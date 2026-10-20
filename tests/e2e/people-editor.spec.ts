import { test, expect } from "@playwright/test";

test("yönetim kurulu panelinden kişi detayı düzenlenir ve Hakkımızda'da görünür", async ({
  page,
}) => {
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Yönetim modülleri" }),
  ).toBeVisible();
  await page.locator('a[href="/admin/people"]').click();
  await expect(page.getByRole("heading", { name: "Hakkımızda" })).toBeVisible();
  await expect(page.locator(".people-editor-item")).toHaveCount(16);
  const person = page
    .locator(".people-editor-item")
    .filter({ hasText: "Kişi · Hamza Yiğit Adıgüzel" });
  await person.locator("summary").first().click();
  await person
    .getByRole("textbox", { name: "Alıntı" })
    .fill("Test için güncellenen alıntı");
  await person.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByRole("status")).toContainText("kaydedildi");
  await page.goto("/hakkimizda");
  await expect(page.getByText("Test için güncellenen alıntı")).toBeVisible();
});
