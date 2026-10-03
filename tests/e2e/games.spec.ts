import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("2026 oyun editörü, gerçek yapımcı onayı, finalist, tam yayın ve geri çekme", async ({
  page,
  browser,
}) => {
  await page.goto("/admin");
  await page.getByLabel("E-posta").fill("admin-e2e@test.invalid");
  await page
    .getByLabel("Parola", { exact: true })
    .fill("E2E-only-password-long-42");
  await page
    .getByLabel("Doğrulama veya kurtarma kodu")
    .fill("dddddddddddddddddddddddddddddddd");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await page.getByRole("link", { name: "Oyunlar", exact: true }).click();
  await page
    .getByRole("link", { name: /Adsız arşiv oyunu · https:\/\/subzero-41/ })
    .click();
  await expect(page).toHaveURL(/\/admin\/oyunlar\/[a-f0-9-]{36}$/);
  await page.getByLabel("Oyun adı", { exact: true }).fill("DEMO arşiv oyunu");
  await page
    .getByLabel("Oyun adresi", { exact: true })
    .fill("demo-archive-game");
  await page
    .getByLabel("Açıklama", { exact: true })
    .fill("DEMO doğrulanmış oyun açıklaması.");
  await page.getByLabel("Doğrulanmış 2026 takım adı").fill("DEMO arşiv takımı");
  await page.getByLabel("Kısmi 2026 arşiv kaydı olarak yayımla").uncheck();
  await page.getByRole("button", { name: "Yapımcı ekle", exact: true }).click();
  await page.getByLabel("1. önerilen yayın adı").fill("DEMO yayın adı");
  await page.getByRole("button", { name: "Oyun taslağını kaydet" }).click();
  await expect(page.getByRole("status")).toContainText("Taslak kaydedildi");
  const saved = await (
    await page.request.get(
      "/api/admin/games/" + new URL(page.url()).pathname.split("/").at(-1),
    )
  ).json();
  expect({
    title: saved.game.title,
    slug: saved.game.slug,
    description: saved.game.description,
    editorialTeamName: saved.game.editorialTeamName,
    historicalPartial: saved.game.historicalPartial,
  }).toEqual({
    title: "DEMO arşiv oyunu",
    slug: "demo-archive-game",
    description: "DEMO doğrulanmış oyun açıklaması.",
    editorialTeamName: "DEMO arşiv takımı",
    historicalPartial: false,
  });
  await page
    .getByRole("button", { name: "Oyunu yayımla", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "açık rıza/onay gerekli",
  );
  const invite = (await page
    .getByRole("link", {
      name: "1. yapımcıya özel onay bağlantısı (yeni sekmede)",
    })
    .getAttribute("href"))!;
  const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 390, height: 900 },
    }),
    owner = await context.newPage();
  await owner.goto(new URL(invite, page.url()).toString());
  await owner
    .getByLabel("Bu adın bu oyunda herkese açık yayımlanmasına izin veriyorum.")
    .check();
  await owner
    .getByRole("button", { name: "Yayın adımı onayla", exact: true })
    .click();
  await expect(owner.getByRole("status")).toContainText("onay kaydedildi");
  await page.getByRole("button", { name: "Onayları ve kaydı yenile" }).click();
  await expect(page.getByText("Yayın onayı: Alındı")).toBeVisible();
  await page.getByRole("button", { name: "Finalist olarak işaretle" }).click();
  await expect(page.getByText(/Finalist: Evet/)).toBeVisible();
  await page
    .getByRole("button", { name: "Oyunu yayımla", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Oyun yayımlandı.");
  await page.getByRole("link", { name: "Genel oyun sayfasını aç" }).click();
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(
    page.getByRole("heading", { name: "DEMO arşiv oyunu", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Yapımcılar: DEMO yayın adı")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Oyunu itch.io’da aç (yeni sekmede)" }),
  ).toHaveAttribute("href", "https://subzero-41.itch.io/lost-pieces");
  await expect(page).toHaveTitle(/DEMO arşiv oyunu/);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".local/task20-public-game-mobile.png",
    fullPage: true,
  });
  await page.goto("/ulujam");
  const archive = page.getByRole("region", { name: "UluJam 2026 arşivi" });
  await expect(
    archive
      .getByRole("region", { name: "Finalist oyunları" })
      .getByText("DEMO arşiv oyunu", { exact: true }),
  ).toBeVisible();
  await page.goto("/oyunlar/demo-archive-game");
  await owner.getByRole("button", { name: "Yayın onayımı geri çek" }).click();
  await expect(owner.getByRole("status")).toContainText("geri çekildi");
  await page.reload();
  await expect(page.getByRole("heading", { name: /404/ })).toBeVisible();
  await context.close();
});
test("Oyun/consent API anonim ve CSRF reddi", async ({ request }) => {
  expect((await request.get("/api/admin/games")).status()).toBe(401);
  expect((await request.post("/api/admin/games")).status()).toBe(403);
  expect((await request.post("/api/cards/publication-consent")).status()).toBe(
    403,
  );
});
