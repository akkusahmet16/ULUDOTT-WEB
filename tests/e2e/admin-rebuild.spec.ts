import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";
import AxeBuilder from "@axe-core/playwright";
test.use({ actionTimeout: 10_000 });
async function login(page: Page) {
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Yönetim modülleri" }),
  ).toBeVisible();
}
async function peopleMutation(page: Page, body: unknown) {
  const csrfResponse = await page.request.get("/api/admin/csrf");
  const { csrfToken } = await csrfResponse.json();
  const response = await page.request.post("/api/admin/people", {
    headers: {
      "x-csrf-token": csrfToken,
      Origin: new URL(csrfResponse.url()).origin,
    },
    data: body,
  });
  expect(response.ok()).toBe(true);
  return response.json();
}

test("yeniden kurulan panelde etkinlik afişi, UluJam yılı, önizleme, yayın ve kaldırma", async ({
  page,
}) => {
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Birlikte yönet.", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".local/admin-rebuild/dashboard-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: ".local/admin-rebuild/dashboard-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/admin/etkinlikler");
  await expect(
    page.getByRole("heading", { name: "Etkinlikler", exact: true }),
  ).toBeVisible();
  const form = page.getByRole("form", {
    name: "Etkinlik düzenleyici",
    exact: true,
  });
  await form
    .getByLabel("Başlık", { exact: true })
    .fill("Yeni panel UluJam buluşması");
  await form
    .getByLabel("Açıklama", { exact: true })
    .fill("Yeni panelden hazırlanan etkinliğin sitede değişmeyen açıklaması.");
  await form
    .getByLabel("Tarih ve başlangıç saati (İstanbul)")
    .fill("2037-01-02T13:00");
  await form
    .getByLabel("Bitiş saati / tarih (İstanbul)")
    .fill("2037-01-03T17:00");
  await form.getByLabel("Konum", { exact: true }).fill("Topluluk salonu");
  await form.getByLabel("Etkinlik türü").selectOption("ulujam");
  await form.getByLabel("UluJam yılı").fill("2037");
  const upload = page.getByRole("region", { name: "Etkinlik afişi yükleme" });
  await upload.getByLabel("Afiş dosyası").setInputFiles({
    name: "afis.png",
    mimeType: "image/png",
    buffer: await sharp({
      create: { width: 1080, height: 1350, channels: 3, background: "#455d66" },
    })
      .png()
      .toBuffer(),
  });
  await upload
    .getByLabel("Görsel açıklaması")
    .fill("Yeni panel etkinlik afişi");
  await upload.getByRole("checkbox").check();
  await upload.getByRole("button", { name: "Afişi yükle ve hazırla" }).click();
  await expect(page.getByRole("status")).toContainText("Afiş hazır");
  await page
    .getByRole("button", { name: "Taslağı kaydet", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Kaydedildi");
  await expect(form.getByLabel("UluJam yılı")).toHaveValue("2037");
  await page.getByRole("button", { name: "Önizleme", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "İçerik önizleme" })
      .getByText(
        "Yeni panelden hazırlanan etkinliğin sitede değişmeyen açıklaması.",
      ),
  ).toBeVisible();
  await page.screenshot({
    path: ".local/admin-rebuild/events-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Yayın etkisini göster" }).click();
  await page.getByRole("button", { name: "Yayını onayla" }).click();
  await expect(page.getByRole("status")).toContainText("Yayın güncellendi");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/etkinlikler/yeni-panel-ulujam-bulusmasi");
  await expect(
    page.getByRole("heading", {
      name: "Yeni panel UluJam buluşması",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Yeni panel etkinlik afişi", exact: true }),
  ).toBeVisible();
  await page.goto("/admin/etkinlikler");
  await page.getByLabel("Etkinlik ara", { exact: true }).fill("Yeni panel");
  const record = page.getByRole("article", {
    name: "Yeni panel UluJam buluşması",
    exact: true,
  });
  await record.getByRole("button", { name: "Düzenle", exact: true }).click();
  await expect(form.getByLabel("Başlık", { exact: true })).toHaveValue(
    "Yeni panel UluJam buluşması",
  );
  await page.setViewportSize({ width: 390, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".local/admin-rebuild/events-mobile.png",
    fullPage: true,
  });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Yayından kaldır / arşivle" }).click();
  await page.getByRole("button", { name: "Arşivlemeyi onayla" }).click();
  await expect(page.getByRole("status")).toContainText("Yayın güncellendi");
  expect(
    (await page.goto("/etkinlikler/yeni-panel-ulujam-bulusmasi"))?.status(),
  ).toBe(404);
});

test("kişisi olmayan Çaycı 2ce videosu panelden kaydedilip Hakkımızda'da gösterilir", async ({
  page,
}) => {
  await login(page);
  const original = (await (await page.request.get("/api/admin/people")).json())
    .items;
  const member = original.find(
    (item: { slot: string }) => item.slot === "member:cayci-2ce",
  );
  const chapter = original.find(
    (item: { slot: string }) => item.slot === "chapter:cayci-2ce",
  );
  try {
    await peopleMutation(page, {
      action: "save",
      slot: member.slot,
      expectedRevision: member.revision,
      fields: { ...member.fields, chapterSlug: "etkinlik-ekip" },
    });
    await page.goto("/admin/people");
    await page
      .getByRole("button", { name: "Bölüm ve videolar", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Bölüm filtresi", exact: true })
      .selectOption("cayci-2ce");
    const item = page.locator(".people-editor-item:not([hidden])");
    await expect(item).toHaveCount(1);
    await item.locator(":scope > summary").click();
    await item.getByLabel("Bölüm başlığı").fill("Çaycı 2ce");
    await page
      .getByRole("combobox", { name: "Bölüm filtresi", exact: true })
      .selectOption("etkinlik-ekip");
    await page
      .getByRole("combobox", { name: "Bölüm filtresi", exact: true })
      .selectOption("cayci-2ce");
    await expect(item.getByLabel("Bölüm başlığı")).toHaveValue("Çaycı 2ce");
    const video = item.getByRole("group", {
      name: "Açılış videosu",
      exact: true,
    });
    await video.getByText("Klasörden video seç", { exact: true }).click();
    await video
      .getByRole("button", { name: "cayci-tugce-acilis.mp4", exact: true })
      .click();
    await item.getByRole("button", { name: "Kaydet", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("kaydedildi");
    await page.goto("/hakkimizda");
    const section = page.getByRole("region", {
      name: "Çaycı 2ce",
      exact: true,
    });
    await expect(section).toBeAttached();
    await expect(section.locator("video")).toHaveAttribute(
      "src",
      "/community/03-hakkimizda/people/cayci-tuce/cayci-tugce-acilis.mp4",
    );
    expect(
      (
        await page.request.get(
          "/community/03-hakkimizda/people/cayci-tuce/cayci-tugce-acilis.mp4",
        )
      ).status(),
    ).toBe(200);
    await section
      .getByRole("heading", { name: "Çaycı 2ce", exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({ path: ".local/admin-rebuild/cayci-2ce.png" });
  } finally {
    for (const old of [member, chapter]) {
      const items = (await (await page.request.get("/api/admin/people")).json())
        .items;
      const current = items.find(
        (item: { slot: string }) => item.slot === old.slot,
      );
      await peopleMutation(page, {
        action: "save",
        slot: old.slot,
        expectedRevision: current.revision,
        fields: old.fields,
      });
    }
  }
});

test("duyuru paylaşımı kaldırıldı, mobil menüde diğer yönetimler kullanılabilir", async ({
  page,
}) => {
  for (const route of [
    "/duyurular",
    "/duyurular/ornek",
    "/admin/duyurular",
    "/api/admin/announcements",
  ])
    expect((await page.request.get(route)).status()).toBe(404);
  expect(
    (
      await page.request.post("/api/admin/announcements", { data: {} })
    ).status(),
  ).toBe(404);
  await page.setViewportSize({ width: 390, height: 900 });
  await login(page);
  const nav = page.getByRole("navigation", {
    name: "Yönetim modülleri",
    exact: true,
  });
  await nav
    .getByRole("button", { name: "Yönetim menüsünü aç", exact: true })
    .click();
  for (const label of [
    "Etkinlikler",
    "Hakkımızda",
    "Oyunlar",
    "UluJam yönetimi",
    "İletişim",
  ])
    await expect(
      nav.getByRole("link", { name: label, exact: false }),
    ).toBeVisible();
  await expect(
    nav.getByRole("link", { name: "Duyurular", exact: false }),
  ).toHaveCount(0);
  await nav.getByRole("link", { name: "Hakkımızda", exact: false }).click();
  await expect(
    page.getByRole("heading", { name: "Hakkımızda", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/admin/galeri");
  await expect(page).toHaveURL(/admin\/ulujam-arsivleri$/);
  await page.goto("/");
  await expect(page.locator('a[href^="/duyurular"]')).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Duyurular", exact: true }),
  ).toHaveCount(0);
});

test("Hakkımızda filtreleri kaydedilmemiş kişi metni ve medya seçimini korur", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/people");
  await page.getByRole("button", { name: "Kişiler", exact: true }).click();
  const query = page.getByRole("searchbox", {
    name: "Kişi veya bölüm ara",
    exact: true,
  });
  await query.fill("Hamza");
  const item = page.locator(".people-editor-item:not([hidden])");
  await expect(item).toHaveCount(1);
  await item.locator(":scope > summary").click();
  await item
    .getByLabel("Ad soyad", { exact: true })
    .fill("Kaydedilmemiş kişi metni");
  const photo = item.getByRole("group", {
    name: "Kişi fotoğrafı",
    exact: true,
  });
  await photo.getByText("Klasörden görsel seç", { exact: true }).click();
  const firstAsset = photo.locator("button[aria-pressed]").first();
  await firstAsset.click();
  const chosen = await photo.locator("img").first().getAttribute("src");
  await query.fill("Bulunmayan kişi");
  await query.fill("Hamza");
  await expect(item.getByLabel("Ad soyad", { exact: true })).toHaveValue(
    "Kaydedilmemiş kişi metni",
  );
  await expect(photo.locator("img").first()).toHaveAttribute("src", chosen!);
});
