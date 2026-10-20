import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Yönetim modülleri" }),
  ).toBeVisible();
}
async function restore(
  request: APIRequestContext,
  endpoint: string,
  input: unknown,
) {
  const latest = await (await request.get(endpoint)).json();
  const { csrfToken } = await (await request.get("/api/admin/csrf")).json();
  const response = await request.post(endpoint, {
    headers: { "x-csrf-token": csrfToken, Origin: "http://127.0.0.1:3100" },
    data: { input, expectedRevision: latest.revision },
  });
  expect(response.ok()).toBe(true);
}

test("UluJam video bağlantısı panelden değiştirilir ve kaldırılınca eski video geri gelmez", async ({
  page,
}) => {
  await login(page);
  const endpoint = "/api/admin/ulujam-settings";
  const original = await (await page.request.get(endpoint)).json();
  try {
    await page.goto("/admin/ulujam");
    await page
      .getByLabel("YouTube video bağlantısı", { exact: true })
      .fill("https://youtu.be/abcdefghijk");
    await page
      .getByLabel("Video başlığı", { exact: true })
      .fill("Panelden UluJam videosu");
    await page
      .getByRole("button", { name: "UluJam ayarlarını kaydet", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "UluJam ayarları kaydedildi",
    );
    await page.screenshot({
      path: ".local/admin-content-preview/ulujam-admin-desktop.png",
      fullPage: true,
    });
    await page.goto("/");
    await page
      .getByRole("button", { name: "UluJam içeriklerini aç", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "UluJam", exact: true });
    await expect(
      dialog.getByRole("heading", {
        name: "Panelden UluJam videosu",
        exact: true,
      }),
    ).toBeVisible();
    await dialog
      .getByRole("button", { name: "Vlogu oynat", exact: true })
      .click();
    await expect(dialog.locator("iframe")).toHaveAttribute(
      "src",
      /youtube-nocookie.com\/embed\/abcdefghijk/,
    );
    await page.keyboard.press("Escape");
    await page.goto("/admin/ulujam");
    await page.getByLabel("Videoyu sitede göster", { exact: true }).uncheck();
    await page
      .getByRole("button", { name: "UluJam ayarlarını kaydet", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("kaydedildi");
    await page.goto("/");
    await page
      .getByRole("button", { name: "UluJam içeriklerini aç", exact: true })
      .click();
    await expect(
      dialog.getByRole("button", { name: "Vlogu oynat", exact: true }),
    ).toHaveCount(0);
    await expect(dialog.locator("iframe")).toHaveCount(0);
  } finally {
    await restore(page.request, endpoint, original.data);
  }
});

test("başvuru ana sayfa ve UluJam'de birlikte açılır; kapatma açık formdan gönderimi durdurur", async ({
  page,
  context,
}) => {
  await login(page);
  const endpoint = "/api/admin/ulujam-settings";
  const original = await (await page.request.get(endpoint)).json();
  const form = original.forms.find(
    (item: { slug: string }) => item.slug === "e2e-admin-ulujam-settings",
  );
  try {
    await page.goto("/admin/ulujam");
    await page
      .getByLabel("UluJam başvuru formu", { exact: true })
      .selectOption(form.id);
    await page
      .getByLabel("Başvuru başlığı", { exact: true })
      .fill("Yeni dönem UluJam başvurusu");
    await page
      .getByRole("textbox", { name: "Başvuru açıklaması", exact: true })
      .fill("Takımınla veya tek başına katıl.");
    await page
      .getByLabel("Başvuru butonu metni", { exact: true })
      .fill("UluJam’e başvur");
    await page
      .getByRole("textbox", {
        name: "Başvurular kapalıyken gösterilecek metin",
        exact: true,
      })
      .fill("Bu dönem başvuruları kapalı.");
    await page.getByLabel("Başvuruları yayımla", { exact: true }).check();
    await page
      .getByRole("button", { name: "UluJam ayarlarını kaydet", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("kaydedildi");
    await page.goto("/");
    await page
      .getByRole("button", { name: "UluJam içeriklerini aç", exact: true })
      .click();
    const cta = page
      .getByRole("dialog", { name: "UluJam", exact: true })
      .getByRole("link", { name: "UluJam’e başvur", exact: true });
    await expect(cta).toHaveAttribute(
      "href",
      "/basvuru/e2e-admin-ulujam-settings",
    );
    await page.keyboard.press("Escape");
    await page.goto("/ulujam");
    await page
      .getByRole("link", { name: "UluJam’e başvur", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Yeni dönem UluJam başvurusu",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeAttached();
    await page.getByLabel("Ad soyad *").fill("DEMO kapatma testi");
    await page.getByLabel("E-posta *").fill("closed-panel@test.invalid");
    await page.getByLabel("Telefon *").fill("+905551234567");
    await page.getByLabel("Yazılım", { exact: true }).check();
    await page.getByLabel("Yazılım seviyesi *").fill("3");
    const admin = await context.newPage();
    await admin.goto("/admin/ulujam");
    await admin
      .getByRole("button", { name: "Başvuruları kapat", exact: true })
      .click();
    await expect(admin.getByRole("status")).toContainText("kaydedildi");
    await page
      .getByRole("button", { name: "Başvuruyu gönder", exact: true })
      .click();
    await expect(page.getByRole("main").getByRole("status")).toContainText(
      "başvuru almıyor",
    );
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Başvuruyu gönder", exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole("status")).toContainText(
      "Bu dönem başvuruları kapalı",
    );
    await page.goto("/ulujam");
    await expect(
      page.getByText("Bu dönem başvuruları kapalı.", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "UluJam’e başvur", exact: true }),
    ).toHaveCount(0);
    await admin.close();
  } finally {
    await restore(page.request, endpoint, original.data);
  }
});

test("yeni arşiv klasör fotoğrafıyla aynı şablonda yayımlanır ve kaldırılır", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/ulujam-arsivleri");
  const editor = page.getByRole("region", {
    name: "UluJam arşiv düzenleyici",
    exact: true,
  });
  await editor.getByLabel("Arşiv yılı", { exact: true }).fill("2024");
  await editor
    .getByLabel("Arşiv açıklaması", { exact: true })
    .fill("2024'te birlikte ürettik.");
  await editor
    .getByRole("button", { name: "Fotoğraf ekle", exact: true })
    .click();
  const photo = editor.getByRole("group", {
    name: "1. arşiv fotoğrafı",
    exact: true,
  });
  await photo.getByText("Klasörden görsel seç", { exact: true }).click();
  await photo
    .getByRole("button", { name: "ulujam-2026-galeri-02.webp", exact: true })
    .click();
  await editor
    .getByLabel("Fotoğraf açıklaması", { exact: true })
    .fill("Yeni arşivden bir kare");
  await editor
    .getByRole("button", { name: "Derece oyunu ekle", exact: true })
    .click();
  await editor
    .getByLabel("Kayıtlı oyundan doldur", { exact: true })
    .selectOption("57ec6120-57ab-4be4-a992-4537b7781201");
  await editor
    .getByRole("button", { name: "Taslağı kaydet", exact: true })
    .click();
  await expect(editor.getByRole("status")).toContainText("taslak");
  await page.goto("/ulujam");
  await expect(
    page.getByRole("heading", { name: "UluJam 2024 arşivi", exact: true }),
  ).toHaveCount(0);
  await page.goto("/admin/ulujam-arsivleri");
  await editor
    .getByRole("button", { name: "UluJam 2024 düzenle", exact: true })
    .click();
  await editor.getByRole("button", { name: "Yayımla", exact: true }).click();
  await expect(editor.getByRole("status")).toContainText("yayımlandı");
  await page.goto("/ulujam");
  const archive = page.getByRole("region", {
    name: "UluJam 2024 arşivi",
    exact: true,
  });
  await expect(
    archive.getByRole("heading", { name: "No Time To Die", exact: true }),
  ).toBeVisible();
  const archiveImage = archive.getByRole("img", {
    name: "Yeni arşivden bir kare",
    exact: true,
  });
  await expect(archiveImage).toHaveAttribute("src", /^\/_next\/image\?/);
  expect(
    new URL(
      (await archiveImage.getAttribute("src"))!,
      page.url(),
    ).searchParams.get("url"),
  ).toBe("/community/02-ulujam/2026-arsiv/ulujam-2026-galeri-02.webp");
  await archiveImage.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      archiveImage.evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect(archive.locator("figcaption")).toContainText("UluJam 2024 / 01");
  await expect(archive.locator("figure").first()).toHaveClass(
    /archive-gallery-featured/,
  );
  await page.screenshot({
    path: ".local/admin-content-preview/ulujam-archives-desktop.png",
    fullPage: true,
  });
  await page.goto("/admin/ulujam-arsivleri");
  await editor
    .getByRole("button", { name: "UluJam 2024 düzenle", exact: true })
    .click();
  await editor
    .getByRole("button", { name: "Yayından kaldır", exact: true })
    .click();
  await expect(editor.getByRole("status")).toContainText("taslak");
  await page.goto("/ulujam");
  await expect(
    page.getByRole("region", { name: "UluJam 2024 arşivi", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "UluJam 2026 arşivi", exact: true }),
  ).toBeVisible();
});

test("iletişim ve footer aynı bağlantıyı günceller, kaldırılan sosyal adres geri gelmez", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const endpoint = "/api/admin/contact-settings";
  const original = await (await page.request.get(endpoint)).json();
  try {
    await page.goto("/admin/iletisim");
    await page
      .getByLabel("E-posta adresi", { exact: false })
      .fill("hello@uludott.test");
    await page
      .getByLabel("Telefon", { exact: false })
      .fill("+90 555 123 45 67");
    const first = page.getByRole("group", { name: "1. bağlantı", exact: true });
    await first
      .getByLabel("Bağlantı adresi", { exact: true })
      .fill("https://instagram.com/new-uludott");
    await page
      .getByRole("group", { name: "2. bağlantı", exact: true })
      .getByRole("button", { name: "Bağlantıyı kaldır", exact: true })
      .click();
    await page
      .getByRole("button", { name: "İletişim ayarlarını kaydet", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("kaydedildi");
    await page.goto("/iletisim");
    await expect(
      page.getByRole("link", { name: /hello@uludott.test/ }),
    ).toHaveAttribute("href", "mailto:hello@uludott.test");
    await expect(
      page.getByRole("link", { name: /555 123 45 67/ }),
    ).toHaveAttribute("href", "tel:+905551234567");
    const contact = page.getByRole("navigation", {
      name: "Sosyal medya hesaplarımız",
      exact: true,
    });
    const footer = page
      .getByRole("contentinfo")
      .getByRole("navigation", { name: "Sosyal medya", exact: true });
    for (const nav of [contact, footer]) {
      await expect(
        nav.getByRole("link", { name: "Instagram", exact: true }),
      ).toHaveAttribute("href", "https://instagram.com/new-uludott");
      await expect(
        nav.getByRole("link", { name: "WhatsApp", exact: true }),
      ).toHaveCount(0);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: ".local/admin-content-preview/contact-mobile.png",
      fullPage: true,
    });
  } finally {
    await restore(page.request, endpoint, original.data);
  }
});

test("yeni yönetim ayarları anonim okuma ve CSRF'siz yazmayı reddeder", async ({
  request,
}) => {
  for (const endpoint of [
    "ulujam-settings",
    "ulujam-archives",
    "contact-settings",
  ]) {
    expect((await request.get(`/api/admin/${endpoint}`)).status()).toBe(401);
    expect((await request.post(`/api/admin/${endpoint}`)).status()).toBe(403);
  }
});
