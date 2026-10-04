import { test, expect } from "@playwright/test";

test("yönetim kurulu panelinden kişi detayı düzenlenir ve Hakkımızda'da görünür", async ({
  page,
}) => {
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();
  await page.getByRole("link", { name: "Yönetim kurulu", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Yönetim kurulu içerikleri" }),
  ).toBeVisible();
  await expect(page.locator(".people-editor-item")).toHaveCount(13);
  const person = page
    .locator(".people-editor-item")
    .filter({ hasText: "Kişi · Hamza Yiğit Adıgüzel" });
  await person.locator("summary").click();
  await person
    .getByRole("textbox", { name: "Alıntı" })
    .fill("Test için güncellenen alıntı");
  await person.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByRole("status")).toContainText("kaydedildi");
  await page.goto("/hakkimizda");
  await expect(page.getByText("Test için güncellenen alıntı")).toBeVisible();
});
