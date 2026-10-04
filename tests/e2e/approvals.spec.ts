import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("Kadro, beceri, etkilenen kart ve gerekçeli yönetici kararları", async ({
  page,
}) => {
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await page.getByRole("link", { name: "Takım onayları", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Etkinlik", exact: true })
    .selectOption({ label: "DEMO UluJam başvuru" });
  await page.getByRole("button", { name: "Kuyruğu getir" }).click();
  const team = page.getByRole("article", {
    name: "DEMO onay takımı",
    exact: true,
  });
  await expect(team).toContainText("Gerçek/beklenen: 1/2");
  await expect(team).toContainText("Yazılım 3/5");
  await team.getByRole("button", { name: "Onayla", exact: true }).click();
  await expect(team).toContainText("Durum: approved");
  await expect(team).toContainText("active");
  await team.getByLabel("Karar gerekçesi").fill("DEMO inceleme notu");
  await team
    .getByRole("button", { name: "Değişiklik iste", exact: true })
    .click();
  await expect(team).toContainText("Durum: changes_requested");
  await expect(team).toContainText("DEMO inceleme notu");
  await expect(team).toContainText("active");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await team.getByRole("button", { name: "Reddet", exact: true }).click();
  await expect(team).toContainText("Durum: rejected");
  await expect(team).toContainText("revoked");
  const solo = page.getByRole("article", {
    name: "DEMO solo onay",
    exact: true,
  });
  await solo.getByRole("button", { name: "Onayla", exact: true }).click();
  await expect(solo).toContainText("approved");
  expect(await page.locator("main").innerText()).not.toContain(
    "approval-e2e@test.invalid",
  );
});
test("Onay API anonim/CSRF koruması", async ({ request }) => {
  expect((await request.get("/api/admin/approvals")).status()).toBe(401);
  expect((await request.post("/api/admin/approvals")).status()).toBe(403);
});
