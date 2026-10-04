import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("Yönetici beceri filtresi, açıklamalı öneri, atama ve geri alma", async ({
  page,
}) => {
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await page
    .getByRole("link", { name: "Takım arayanlar", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Etkinlik", exact: true })
    .selectOption({ label: "DEMO UluJam başvuru" });
  await page
    .getByRole("combobox", { name: "Beceri alanı", exact: true })
    .selectOption("visual_art");
  await page
    .getByRole("combobox", { name: "En düşük seviye", exact: true })
    .selectOption("4");
  await page.getByRole("button", { name: "Filtrele", exact: true }).click();
  const person = page.getByRole("article", {
    name: "DEMO arayan",
    exact: true,
  });
  await expect(person).toBeVisible();
  await person.getByText(/^Diğer uygun takımlar \(\d+\)$/).click();
  const team = person.getByRole("region", {
    name: "DEMO eşleştirme takımı",
    exact: true,
  });
  await expect(team).toContainText("Görsel sanat 4/5");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await team.getByRole("button", { name: "Bu takıma ata" }).click();
  await expect(person).toContainText("Atandığı takım: DEMO eşleştirme takımı");
  await person.getByRole("button", { name: "Atamayı geri al" }).click();
  await expect(
    person.getByRole("button", { name: "Atamayı geri al" }),
  ).toHaveCount(0);
  expect(await page.locator("main").innerText()).not.toContain(
    "matching-e2e@test.invalid",
  );
});
test("Atama endpointi anonim GET ve CSRF olmayan POST reddeder", async ({
  request,
}) => {
  expect((await request.get("/api/admin/assignments")).status()).toBe(401);
  expect((await request.post("/api/admin/assignments")).status()).toBe(403);
});
