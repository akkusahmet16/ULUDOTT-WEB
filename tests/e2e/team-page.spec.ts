import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("UluJam kayıt, yeni takım makbuzu, güvenli giriş/çıkış ve kişisel veri izolasyonu", async ({
  page,
  browser,
}) => {
  await page.goto("/basvuru/e2e-ulujam");
  await page.getByLabel("Ad soyad *").fill("DEMO özel kişi");
  await page.getByLabel("E-posta *").fill("team-e2e@test.invalid");
  await page.getByLabel("Telefon *").fill("+905551234567");
  await page.getByLabel("Yazılım", { exact: true }).check();
  await page.getByLabel("Yazılım seviyesi *").fill("3");
  await page.getByLabel("Yeni takım kuruyorum", { exact: true }).check();
  await page.getByLabel("Takım adı *").fill("DEMO E2E takım");
  await page.getByLabel("Beklenen toplam kişi sayısı *").fill("2");
  await page
    .getByRole("button", { name: "Başvuruyu gönder", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Başvuru alındı" }),
  ).toBeVisible();
  const password = await page.getByTestId("new-team-password").innerText();
  const url = await page
    .getByRole("link", { name: "Takım sayfasını aç", exact: true })
    .getAttribute("href");
  await page
    .getByRole("link", { name: "Takım sayfasını aç", exact: true })
    .click();
  await page.getByLabel("Takım parolası", { exact: true }).fill("wrong");
  await page
    .getByRole("button", { name: "Takıma giriş yap", exact: true })
    .click();
  await expect(page.locator("main").getByRole("alert")).toHaveText(
    "Takım erişimi geçersiz",
  );
  await page.getByLabel("Takım parolası", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Takıma giriş yap", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "DEMO E2E takım", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Üye sayısı: 1 / 2")).toBeVisible();
  const body = await page.locator("body").innerText();
  for (const secret of ["team-e2e@test.invalid", "+905551234567", password])
    expect(body).not.toContain(secret);
  await expect(
    page.getByRole("region", { name: "Takım kart özetleri" }),
  ).toContainText("DEMO özel kişi");
  await expect(page.getByRole("link", { name: /Wallet|Kart/ })).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const other = await browser.newContext({ ignoreHTTPSErrors: true }),
    p = await other.newPage();
  await p.goto(new URL(url!, page.url()).toString());
  await expect(
    p.getByRole("heading", { name: "DEMO E2E takım", exact: true }),
  ).toHaveCount(0);
  await expect(p.getByLabel("Takım parolası", { exact: true })).toBeVisible();
  await other.close();
  await page
    .getByRole("button", { name: "Takımdan çıkış yap", exact: true })
    .click();
  await expect(
    page.getByLabel("Takım parolası", { exact: true }),
  ).toBeVisible();
});
test("UluJam/team endpoint CSRF olmadan yazmaz", async ({ request }) => {
  for (const route of [
    "ulujam/apply",
    "team/login",
    "team/logout",
    "admin/teams/access",
  ])
    expect((await request.post("/api/" + route)).status()).toBe(403);
});
