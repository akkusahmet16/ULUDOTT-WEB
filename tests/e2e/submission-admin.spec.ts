import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
test("başvuru arama, sürümlü düzeltme, durum, güvenli indirme ve silme", async ({
  page,
}) => {
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();
  await page.getByRole("link", { name: "Başvurular", exact: true }).click();
  await page
    .getByLabel("Form", { exact: true })
    .selectOption({ label: "E2E başvuru yönetimi" });
  await page.getByLabel("Arama", { exact: true }).fill("=1+1");
  await page.getByRole("button", { name: "Başvuruları getir" }).click();
  await expect(page.getByText("1 kayıt gösteriliyor.")).toBeVisible();
  const csvPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV indir" }).click();
  const csv = await csvPromise;
  expect(await readFile((await csv.path())!, "utf8")).toContain("'=1+1");
  const xlsxPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "XLSX indir" }).click();
  expect((await xlsxPromise).suggestedFilename()).toMatch(/\.xlsx$/);
  await page.getByRole("link", { name: /^Başvuru / }).click();
  await page.getByLabel("Not *", { exact: true }).fill("Düzeltilmiş");
  await page.getByRole("button", { name: "Düzeltmeyi kaydet" }).click();
  await expect(page.getByRole("status")).toHaveText("Kaydedildi.");
  await page.getByLabel("Yeni durum").selectOption("pending");
  await page.getByRole("button", { name: "Durumu kaydet" }).click();
  await expect(
    page.getByText(/Form sürümü: 1 · Durum: İncelemede/),
  ).toBeVisible();
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
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Başvuruyu sil", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin\/basvurular$/);
});
test("başvuru API oturum ve CSRF zorunlu", async ({ request }) => {
  expect(
    (
      await request.get(
        "/api/admin/submissions?formId=00000000-0000-4000-8000-000000000000",
      )
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/admin/submissions/export", { data: {} })
    ).status(),
  ).toBe(403);
});
