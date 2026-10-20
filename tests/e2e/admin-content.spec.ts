import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Yönetim modülleri" }),
  ).toBeVisible();
}

test("yeni kişi klasör görseliyle seçilen sırada görünür ve panelden silinir", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/people");
  await page
    .getByRole("button", { name: "Yeni kişi ekle", exact: true })
    .click();
  const form = page.getByRole("region", { name: "Yeni kişi", exact: true });
  await form.getByLabel("Ad soyad", { exact: true }).fill("Panel Test Üyesi");
  await form.getByLabel("Görev", { exact: true }).fill("Oyun Tasarımcısı");
  await form.getByLabel("Bölüm", { exact: true }).selectOption("etkinlik-ekip");
  await form.getByLabel("Bölüm içi sıra").fill("0");
  await form.getByLabel("Alıntı").fill("Birlikte oyun üretiyoruz.");
  const picker = form.getByRole("group", {
    name: "Kişi fotoğrafı",
    exact: true,
  });
  await picker.getByText("Klasörden görsel seç", { exact: true }).click();
  await picker
    .getByRole("button", { name: "etkinlik-ekip-efe-tutucu.webp", exact: true })
    .click();
  await page.screenshot({
    path: ".local/admin-content-preview/people-desktop.png",
    fullPage: true,
  });
  await form.getByRole("button", { name: "Kişiyi ekle", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("kaydedildi");
  await page.goto("/hakkimizda");
  await expect(
    page
      .locator("#people-etkinlik-ekip .people-detail")
      .first()
      .getByRole("heading", { name: "Panel Test Üyesi" }),
  ).toBeVisible();
  await expect(
    page.getByText("Birlikte oyun üretiyoruz.", { exact: true }),
  ).toBeVisible();
  await page.goto("/admin/people");
  const member = page
    .locator(".people-editor-item")
    .filter({ hasText: "Kişi · Panel Test Üyesi" });
  await member.locator("summary").first().click();
  await member.getByRole("button", { name: "Kişiyi sil", exact: true }).click();
  await page.getByRole("button", { name: "Silmeyi onayla" }).click();
  await expect(page.getByRole("status")).toContainText("Kişi silindi");
  await page.goto("/hakkimizda");
  await expect(
    page.getByRole("heading", { name: "Panel Test Üyesi" }),
  ).toHaveCount(0);
});

test("oyun kartı mobil panelden klasör kapağıyla taslak, yayın ve kaldırma akışını tamamlar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.goto("/admin/oyunlar");
  const catalog = page.getByRole("region", {
    name: "Site oyun kartları",
    exact: true,
  });
  await catalog
    .getByLabel("Oyun adı", { exact: true })
    .fill("Panelden Yeni Oyun");
  await catalog.getByLabel("Ekip / yapımcı bilgisi").fill("Uludott Test Ekibi");
  await catalog
    .getByLabel("Oyun açıklaması")
    .fill("Panel üzerinden hazırlanan oyun açıklaması.");
  await catalog
    .getByLabel("itch.io oyun bağlantısı")
    .fill("https://uludott-test.itch.io/panel-game");
  await catalog.getByLabel("Sayfadaki sıra").fill("0");
  const picker = catalog.getByRole("group", {
    name: "Oyun kapak görseli",
    exact: true,
  });
  await picker.getByText("Klasörden görsel seç", { exact: true }).click();
  await picker
    .getByRole("button", { name: "no-time-to-die.webp", exact: true })
    .click();
  await expect(
    picker.getByRole("button", { name: "no-time-to-die.webp", exact: true }),
  ).toHaveCSS("display", "grid");
  await catalog
    .getByLabel("Kapak görseli açıklaması")
    .fill("Panel oyunu kapak görseli");
  await expect(
    catalog
      .getByRole("region", { name: "Oyun kartı önizleme" })
      .getByText("Panelden Yeni Oyun", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".local/admin-content-preview/games-mobile.png",
    fullPage: true,
  });
  await catalog
    .getByRole("button", { name: "Taslağı kaydet", exact: true })
    .click();
  await expect(catalog.getByRole("status")).toContainText(
    "Taslak sitede görünmez",
  );
  await page.goto("/oyunlar");
  await expect(
    page.getByText("Panelden Yeni Oyun", { exact: true }),
  ).toHaveCount(0);
  await page.goto("/admin/oyunlar");
  await catalog
    .getByRole("button", { name: "Panelden Yeni Oyun düzenle", exact: true })
    .click();
  await catalog.getByRole("button", { name: "Yayımla", exact: true }).click();
  await expect(catalog.getByRole("status")).toContainText("sitede yayımlandı");
  await page.goto("/oyunlar");
  const card = page.locator(".published-game-card").first();
  await expect(card).toContainText("Panelden Yeni Oyun");
  await expect(card).toContainText("Uludott Test Ekibi");
  await expect(card.getByRole("img")).toHaveAttribute(
    "src",
    "/community/06-oyunlar/yayimlanan/no-time-to-die.webp",
  );
  await page.goto("/admin/oyunlar");
  await catalog
    .getByRole("button", { name: "Panelden Yeni Oyun düzenle", exact: true })
    .click();
  await catalog.getByRole("button", { name: "Oyunu sil", exact: true }).click();
  // A second real save makes the open editor stale; the modal itself must announce the conflict.
  const game = (
    await (await page.request.get("/api/admin/game-catalog")).json()
  ).items.find(
    (item: { title: string }) => item.title === "Panelden Yeni Oyun",
  );
  const { id, revision, ...fields } = game;
  const { csrfToken } = await (
    await page.request.get("/api/admin/csrf")
  ).json();
  const concurrent = await page.request.post("/api/admin/game-catalog", {
    headers: { "x-csrf-token": csrfToken, Origin: "http://127.0.0.1:3100" },
    data: {
      action: "save",
      id,
      expectedRevision: revision,
      input: { ...fields, description: "Diğer yöneticinin değişikliği." },
    },
  });
  expect(concurrent.ok()).toBe(true);
  await page.getByRole("button", { name: "Silmeyi onayla" }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Oyunu sil", exact: true })
      .getByRole("alert"),
  ).toContainText("Sürüm çakışması");
  await page
    .getByRole("dialog", { name: "Oyunu sil", exact: true })
    .getByRole("button", { name: "Kapat", exact: true })
    .click();
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/admin/game-catalog") &&
        response.request().method() === "GET",
    ),
    catalog
      .getByRole("button", { name: "Listeyi yenile", exact: true })
      .click(),
  ]);
  await catalog
    .getByRole("button", { name: "Panelden Yeni Oyun düzenle", exact: true })
    .click();
  await catalog.getByRole("button", { name: "Oyunu sil", exact: true }).click();
  await page.getByRole("button", { name: "Silmeyi onayla" }).click();
  await expect(catalog.getByRole("status")).toContainText("Oyun silindi");
  await page.goto("/oyunlar");
  await expect(
    page.getByText("Panelden Yeni Oyun", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("No Time To Die", { exact: true })).toBeVisible();
});
