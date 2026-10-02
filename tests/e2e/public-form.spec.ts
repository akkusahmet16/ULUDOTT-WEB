import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("genel form, koşullu alan, makbuz fragment ve gizli PII", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/basvuru/e2e-public");
  await page
    .getByLabel("E-posta *", { exact: true })
    .fill("visitor@example.test");
  await expect(page.getByLabel("Ek not")).toHaveCount(0);
  await page.getByLabel("Not ekle").check();
  await page.getByLabel("Ek not").fill("Test notu");
  await page.getByLabel("Not ekle").uncheck();
  await expect(page.getByLabel("Ek not")).toHaveCount(0);
  await page.getByLabel("Test rızası *").check();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Başvuruyu gönder" }).click();
  await expect(
    page.getByRole("heading", { name: "Başvuru alındı" }),
  ).toBeVisible();
  const link = page.getByRole("link", { name: "Makbuzu ve durumu görüntüle" });
  await expect(link).toHaveAttribute(
    "href",
    /\/makbuz#token=[A-Za-z0-9_-]{43}$/,
  );
  await link.click();
  await expect(page.getByText("Durum: Alındı", { exact: true })).toBeVisible();
  await expect(page.getByText("visitor@example.test")).toHaveCount(0);
  expect(new URL(page.url()).search).toBe("");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
});
test("taslak form kapalı; receipt ve submit CSRF olmadan erişilemez", async ({
  page,
  request,
}) => {
  await page.goto("/basvuru/nonexistent-form");
  await expect(page.getByRole("heading", { name: /404/ })).toBeVisible();
  expect(
    (
      await request.post("/api/submissions/receipt", {
        data: { token: "x".repeat(43) },
      })
    ).status(),
  ).toBe(403);
  expect(
    (await request.post("/api/forms/e2e-public/submit", { data: {} })).status(),
  ).toBe(403);
});
