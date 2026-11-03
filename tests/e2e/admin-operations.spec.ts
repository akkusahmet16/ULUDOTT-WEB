import { test, expect, type Page } from "@playwright/test";
async function login(page: Page) {
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();
}
test("mobil yönetim araması ve kritik işi yeniden deneme gerçek uç noktayı kullanır", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const nav = page.getByRole("navigation", { name: "Yönetim modülleri" });
  await page
    .getByRole("button", { name: "Yönetim menüsünü aç", exact: true })
    .click();
  await expect(
    nav.getByRole("link", { name: "Başvuru formları", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Yönetim menüsünü kapat", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Birlikte yönet.", exact: true }),
  ).toBeVisible();
  const summary = page.getByRole("region", {
    name: "Etkinlik özeti",
    exact: true,
  });
  await summary
    .getByLabel("Etkinlik ara", { exact: true })
    .fill("does-not-exist");
  await expect(summary.getByText("Aramaya uygun etkinlik yok.")).toBeVisible();
  await expect(summary.getByRole("article")).toHaveCount(0);
  await summary
    .getByLabel("Etkinlik ara", { exact: true })
    .fill("DEMO UluJam başvuru");
  await expect(summary.getByRole("article")).toHaveCount(1);
  await expect(
    summary.getByRole("article", { name: "DEMO UluJam başvuru", exact: true }),
  ).toBeVisible();
  await summary.getByLabel("Etkinlik ara", { exact: true }).fill("");
  await expect(summary.getByRole("article")).not.toHaveCount(0);
  const upcoming = summary
    .getByText("Yaklaşan etkinlik", { exact: true })
    .locator("..");
  await expect(upcoming).toBeVisible();
  expect(Number(await upcoming.locator("strong").innerText())).toBeGreaterThan(
    0,
  );
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: ".local/task25-admin-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Yönetim menüsünü aç", exact: true })
    .click();
  await nav.getByRole("link", { name: "Sistem", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Sistem durumu" }),
  ).toBeVisible();
  const operations = page.getByRole("region", {
    name: "Sistem operasyonları",
    exact: true,
  });
  const terms = operations.locator("dl dt");
  await expect(terms).toHaveCount(7);
  expect(
    await terms.evaluateAll((labels) =>
      labels.every((label) => label.scrollWidth <= label.clientWidth),
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  let mutations = 0;
  await page.route("**/api/admin/outbox/*/retry", (route) => {
    if (route.request().method() === "POST") mutations++;
    return route.continue();
  });
  const job = operations.getByRole("article", {
    name: "Wallet eşitleme",
    exact: true,
  });
  const retry = job.getByRole("button", {
    name: "İşi yeniden dene",
    exact: true,
  });
  await retry.click();
  await expect(
    job.getByText("Tek bir başarısız iş kuyruğa geri alınacak."),
  ).toBeVisible();
  expect(mutations).toBe(0);
  await job.getByRole("button", { name: "Vazgeç", exact: true }).click();
  expect(mutations).toBe(0);
  await expect(
    job.getByRole("region", { name: "İşlem etki önizlemesi" }),
  ).toHaveCount(0);
  await retry.click();
  const response = page.waitForResponse(
    (r) =>
      r
        .url()
        .endsWith(
          "/api/admin/outbox/25000000-0000-4000-8000-000000000001/retry",
        ) && r.request().method() === "POST",
  );
  await job
    .getByRole("button", { name: "Onayla ve kuyruğa al", exact: true })
    .click();
  expect((await response).status()).toBe(200);
  await expect(operations.getByRole("status")).toHaveText("İş kuyruğa alındı.");
  expect(mutations).toBe(1);
  await expect(
    operations.getByRole("button", { name: "İşi yeniden dene", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Yönetim menüsünü aç", exact: true })
    .click();
  await expect(
    nav.getByRole("link", { name: "Genel bakış", exact: true }),
  ).toBeVisible();
});
test("tek şifreli panel tüm yönetim modüllerini gösterir; CSRF hâlâ zorunludur", async ({
  page,
}) => {
  await login(page);
  const nav = page.getByRole("navigation", { name: "Yönetim modülleri" });
  await expect(
    nav.getByRole("link", { name: "Hakkımızda", exact: true }),
  ).toBeVisible();
  await expect(
    nav.getByRole("link", { name: "Başvurular", exact: true }),
  ).toBeVisible();
  await expect(
    nav.getByRole("link", { name: "Sistem", exact: true }),
  ).toBeVisible();
  await page.goto("/admin/sistem");
  await expect(page.getByText("Google Wallet", { exact: true })).toBeVisible();
  expect(
    (
      await page.request.post(
        "/api/admin/outbox/25000000-0000-4000-8000-000000000001/retry",
      )
    ).status(),
  ).toBe(403);
});
