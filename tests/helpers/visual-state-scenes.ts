import { expect, type Page } from "@playwright/test";
import type { VisualCaptureScene } from "./visual-capture.ts";

const phoneField = "0c000000-0000-4000-8000-000000000102";

export type VisualStateScene = VisualCaptureScene & {
  prepare: (page: Page) => Promise<void>;
};

const region = (page: Page, name: string) =>
  page.getByRole("region", { name, exact: true });

async function fillGeneralForm(page: Page) {
  await page
    .getByLabel("Ad soyad *", { exact: true })
    .fill("DEMO görsel başvuran");
  await page
    .getByLabel("E-posta *", { exact: true })
    .fill("visual-state@test.invalid");
  await page.getByLabel("Telefon *", { exact: true }).fill("+905551234567");
  await page.getByLabel("DEMO rızası *", { exact: true }).check();
  await page
    .getByLabel("Katılım alanı", { exact: true })
    .selectOption("software");
}

async function fillUlujamForm(page: Page) {
  await page
    .getByLabel("Ad soyad *", { exact: true })
    .fill("DEMO görsel katılımcı");
  await page
    .getByLabel("E-posta *", { exact: true })
    .fill("visual-ulujam@test.invalid");
  await page.getByLabel("Telefon *", { exact: true }).fill("+905551234567");
  await page.getByLabel("Yazılım", { exact: true }).check();
  await page.getByLabel("Yazılım seviyesi *", { exact: true }).selectOption("3");
}

/**
 * Deliberately retain the owned browser's POST at the transport boundary. The
 * handler itself returns immediately, leaving no pending handler promise or
 * timer. Closing that scene's page/context cancels the request. No backend
 * mutation is sent, and the real component produces its own pending state.
 */
async function holdPost(page: Page, pattern: string) {
  await page.route(pattern, (route) => {
    if (route.request().method() === "POST") return;
    return route.continue();
  });
}

async function selectEvent(page: Page) {
  const workspace = region(page, "Etkinlik yönetimi çalışma alanı");
  await workspace
    .getByRole("article", { name: "DEMO gelecek buluşma", exact: true })
    .getByRole("button", { name: "Düzenle", exact: true })
    .click();
  await expect(
    workspace.getByRole("heading", {
      name: "DEMO gelecek buluşma",
      level: 2,
      exact: true,
    }),
  ).toBeVisible();
  await expect(workspace.getByLabel("Başlık", { exact: true })).toHaveValue(
    "DEMO gelecek buluşma",
  );
  await workspace
    .getByLabel("Başlık", { exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    workspace.getByLabel("Başlık", { exact: true }),
  ).toBeInViewport();
}

async function selectSiteGame(page: Page) {
  const catalog = region(page, "Site oyun kartları");
  await catalog
    .getByRole("button", { name: "DEMO yayımlanmış oyun düzenle", exact: true })
    .click();
  await expect(catalog.getByLabel("Oyun adı", { exact: true })).toHaveValue(
    "DEMO yayımlanmış oyun",
  );
  return catalog;
}

async function firstPersonDetails(page: Page) {
  const workspace = region(page, "Hakkımızda içerik düzenleyici");
  await workspace
    .getByRole("group", { name: "İçerik türü", exact: true })
    .getByRole("button", { name: "Kişiler", exact: true })
    .click();
  const details = workspace
    .locator("details.people-editor-item:not([hidden])")
    .first();
  await details.locator(":scope > summary").click();
  await expect(details).toHaveAttribute("open", "");
  return details;
}

/**
 * Extra states for the isolated full fixture only. Each scene needs a fresh
 * page, normal motion, completed initial reads and real admin cookies, except
 * aliases starting with admin-login. Responses below exercise documented HTTP
 * failures without writing submissions, audit entries, rate limits or jobs.
 * The approved-media extension and its publication dialog are covered by the
 * separate visualAdditionalScenes helper using the same disposable fixture.
 */
export function visualStateScenes(
  paths: Record<string, string>,
): VisualStateScene[] {
  if (!paths.form || !paths.ulujamForm)
    throw Error("FULL_VISUAL_FIXTURE_PATHS_REQUIRED");
  return [
    {
      alias: "state-form-conditional",
      path: paths.form,
      prepare: async (page) => {
        await page.getByLabel("Not ekle", { exact: true }).check();
        await page
          .getByLabel("Ek not", { exact: true })
          .fill("DEMO koşullu başvuru notu.");
        await expect(page.getByLabel("Ek not", { exact: true })).toBeVisible();
      },
    },
    {
      alias: "state-form-filled-focus",
      path: paths.form,
      prepare: async (page) => {
        await fillGeneralForm(page);
        await page.getByLabel("E-posta *", { exact: true }).focus();
        await expect(
          page.getByRole("button", { name: "Başvuruyu gönder", exact: true }),
        ).toBeEnabled();
      },
    },
    {
      alias: "state-form-field-error",
      path: paths.form,
      prepare: async (page) => {
        await fillGeneralForm(page);
        await page.getByLabel("Telefon *", { exact: true }).fill("05551234567");
        await page.route("**/api/forms/visual-public/submit", (route) =>
          route.fulfill({
            status: 400,
            json: {
              error: "İşaretli alanları düzeltin.",
              fieldErrors: {
                [phoneField]:
                  "Telefonu ülke koduyla, boşluksuz yazın (örnek: +905551234567).",
              },
            },
          }),
        );
        await page
          .getByRole("button", { name: "Başvuruyu gönder", exact: true })
          .click();
        await expect(
          page.getByLabel("Telefon *", { exact: true }),
        ).toHaveAttribute("aria-invalid", "true");
        await expect(
          page.locator("form.content-form").getByRole("alert"),
        ).toHaveText("İşaretli alanları düzeltin.");
      },
    },
    {
      alias: "state-form-pending",
      path: paths.form,
      prepare: async (page) => {
        await fillGeneralForm(page);
        await holdPost(page, "**/api/forms/visual-public/submit");
        const request = page.waitForRequest(
          (value) =>
            value.method() === "POST" &&
            new URL(value.url()).pathname === "/api/forms/visual-public/submit",
        );
        await page
          .getByRole("button", { name: "Başvuruyu gönder", exact: true })
          .click();
        await request;
        await expect(
          page.getByRole("button", { name: "Gönderiliyor…", exact: true }),
        ).toBeDisabled();
        await expect(
          page.getByLabel("Ad soyad *", { exact: true }),
        ).toBeDisabled();
      },
    },
    {
      alias: "state-form-server-error",
      path: paths.form,
      prepare: async (page) => {
        await fillGeneralForm(page);
        await page.route("**/api/forms/visual-public/submit", (route) =>
          route.fulfill({
            status: 500,
            json: { error: "İşlem tamamlanamadı" },
          }),
        );
        await page
          .getByRole("button", { name: "Başvuruyu gönder", exact: true })
          .click();
        await expect(
          page.locator("form.content-form").getByRole("alert"),
        ).toHaveText("İşlem tamamlanamadı");
        await expect(
          page.getByRole("button", { name: "Başvuruyu gönder", exact: true }),
        ).toBeEnabled();
      },
    },
    ...[
      { alias: "solo", label: "Tek başına katılıyorum" },
      { alias: "seeking", label: "Takım arıyorum" },
      { alias: "new", label: "Yeni takım kuruyorum" },
      { alias: "existing", label: "Mevcut takıma katılıyorum" },
    ].map(({ alias, label }): VisualStateScene => ({
      alias: `state-ulujam-${alias}`,
      path: paths.ulujamForm,
      prepare: async (page) => {
        await fillUlujamForm(page);
        await page.getByLabel(label, { exact: true }).check();
        if (alias === "new") {
          await page
            .getByLabel("Takım adı *", { exact: true })
            .fill("DEMO yeni görsel takım");
          await page
            .getByLabel("Beklenen toplam kişi sayısı *", { exact: true })
            .fill("3");
        }
        if (alias === "existing") {
          await page
            .getByLabel("Katılacağınız takım *", { exact: true })
            .selectOption({ label: "DEMO görsel takımı" });
          await page.getByLabel("Takım parolası *", { exact: true }).focus();
        }
        await expect(page.getByLabel(label, { exact: true })).toBeChecked();
        await page
          .getByRole("button", { name: "Başvuruyu gönder", exact: true })
          .scrollIntoViewIfNeeded();
      },
    })),
    {
      alias: "state-ulujam-multiple-skills",
      path: paths.ulujamForm,
      prepare: async (page) => {
        await fillUlujamForm(page);
        await page.getByLabel("Görsel sanat", { exact: true }).check();
        await page
          .getByLabel("Görsel sanat seviyesi *", { exact: true })
          .fill("5");
        await page
          .getByLabel("Becerilerinizin açıklaması *", { exact: true })
          .fill("DEMO oyun kodu ve görsel sanat üretimi.");
        await expect(
          page.getByLabel("Becerilerinizin açıklaması *", { exact: true }),
        ).toBeVisible();
      },
    },
    {
      alias: "state-ulujam-validation-error",
      path: paths.ulujamForm,
      prepare: async (page) => {
        await page
          .getByRole("button", { name: "Başvuruyu gönder", exact: true })
          .click();
        await expect(page.getByRole("status")).toHaveText(
          "İşaretli alanları kontrol edin.",
        );
        await expect(
          page.getByLabel("Ad soyad *", { exact: true }),
        ).toHaveAttribute("aria-invalid", "true");
      },
    },
    {
      alias: "admin-login-invalid",
      path: "/admin",
      prepare: async (page) => {
        await page.route("**/api/admin/login", (route) =>
          route.fulfill({
            status: 401,
            json: { error: "Giriş bilgileri doğrulanamadı" },
          }),
        );
        await page
          .getByLabel("Özel şifre", { exact: true })
          .fill("DEMO-invalid-fixture-only");
        await page
          .getByRole("button", { name: "Giriş yap", exact: true })
          .click();
        await expect(
          page
            .getByRole("alert")
            .filter({ hasText: /^Giriş bilgileri doğrulanamadı$/ }),
        ).toHaveText("Giriş bilgileri doğrulanamadı");
      },
    },
    {
      alias: "admin-login-pending",
      path: "/admin",
      prepare: async (page) => {
        await holdPost(page, "**/api/admin/login");
        await page
          .getByLabel("Özel şifre", { exact: true })
          .fill("DEMO-pending-fixture-only");
        const request = page.waitForRequest(
          (value) =>
            value.method() === "POST" &&
            new URL(value.url()).pathname === "/api/admin/login",
        );
        await page
          .getByRole("button", { name: "Giriş yap", exact: true })
          .click();
        await request;
        await expect(
          page.getByRole("button", { name: "Doğrulanıyor…", exact: true }),
        ).toBeDisabled();
      },
    },
    {
      alias: "state-admin-search-empty",
      path: "/admin",
      prepare: async (page) => {
        const summary = region(page, "Etkinlik özeti");
        await summary
          .getByLabel("Etkinlik ara", { exact: true })
          .fill("DEMO-bulunamayan-etkinlik");
        await expect(
          summary.getByText("Aramaya uygun etkinlik yok.", { exact: true }),
        ).toBeVisible();
        await expect(summary.getByRole("article")).toHaveCount(0);
      },
    },
    {
      alias: "state-admin-analytics-open",
      path: "/admin",
      prepare: async (page) => {
        await page
          .getByText("Katılım özeti ve başvuru akışı", { exact: true })
          .click();
        await page
          .getByText("Toplam başvuru", { exact: true })
          .scrollIntoViewIfNeeded();
        await expect(
          page.getByText("Toplam başvuru", { exact: true }),
        ).toBeVisible();
      },
    },
    {
      alias: "state-admin-navigation",
      path: "/admin",
      prepare: async (page) => {
        const open = page.getByRole("button", {
          name: "Yönetim menüsünü aç",
          exact: true,
        });
        if (await open.isVisible()) await open.click();
        const nav = page.getByRole("navigation", {
          name: "Yönetim modülleri",
          exact: true,
        });
        await nav
          .getByRole("link", { name: "Başvuru formları", exact: true })
          .focus();
        await expect(nav).toBeVisible();
      },
    },
    {
      alias: "state-events-new",
      path: "/admin/etkinlikler",
      prepare: async (page) => {
        await region(page, "Etkinlik yönetimi çalışma alanı")
          .getByRole("button", { name: "Yeni etkinlik ＋", exact: true })
          .click();
        await page
          .getByLabel("Başlık", { exact: true })
          .fill("DEMO kaydedilmemiş yeni buluşma");
        await expect(
          page.getByText("Kaydedilmemiş değişiklikler", { exact: true }),
        ).toBeVisible();
      },
    },
    {
      alias: "state-events-selected",
      path: "/admin/etkinlikler",
      prepare: selectEvent,
    },
    {
      alias: "state-events-poster",
      path: "/admin/etkinlikler",
      prepare: async (page) => {
        await selectEvent(page);
        const poster = region(page, "Etkinlik afişi yükleme");
        await poster.scrollIntoViewIfNeeded();
        await expect(poster.getByRole("img")).toBeInViewport();
      },
    },
    {
      alias: "state-events-dates",
      path: "/admin/etkinlikler",
      prepare: async (page) => {
        await selectEvent(page);
        const starts = page.getByLabel("Tarih ve başlangıç saati (İstanbul)", {
          exact: true,
        });
        await starts.scrollIntoViewIfNeeded();
        await expect(starts).toBeInViewport();
        await expect(
          page.getByLabel("Bitiş saati / tarih (İstanbul)", { exact: true }),
        ).toBeInViewport();
      },
    },
    {
      alias: "state-events-advanced",
      path: "/admin/etkinlikler",
      prepare: async (page) => {
        await selectEvent(page);
        await page
          .getByText("Gelişmiş etkinlik ayarları", { exact: true })
          .click();
        await page
          .getByText("Gelişmiş etkinlik ayarları", { exact: true })
          .scrollIntoViewIfNeeded();
      },
    },
    {
      alias: "state-events-preview",
      path: "/admin/etkinlikler",
      prepare: async (page) => {
        await selectEvent(page);
        await region(page, "Etkinlik yayını")
          .getByRole("button", { name: "Önizleme", exact: true })
          .click();
        const preview = region(page, "İçerik önizleme");
        await expect(preview).toBeAttached();
        await preview.scrollIntoViewIfNeeded();
      },
    },
    {
      alias: "state-events-dirty-disabled",
      path: "/admin/etkinlikler",
      prepare: async (page) => {
        await selectEvent(page);
        await page
          .getByLabel("Başlık", { exact: true })
          .fill("DEMO kaydedilmemiş başlık");
        await expect(
          region(page, "Etkinlik yayını").getByRole("button", {
            name: "Önizleme",
            exact: true,
          }),
        ).toBeDisabled();
        await region(page, "Etkinlik yönetimi çalışma alanı")
          .getByRole("button", { name: "Yeni etkinlik ＋", exact: true })
          .click();
        await expect(
          page.getByRole("button", { name: "Kaydetmeden geç", exact: true }),
        ).toBeVisible();
      },
    },
    {
      alias: "state-people-filter",
      path: "/admin/people",
      prepare: async (page) => {
        const workspace = region(page, "Hakkımızda içerik düzenleyici");
        await workspace
          .getByRole("group", { name: "İçerik türü", exact: true })
          .getByRole("button", { name: "Bölüm ve videolar", exact: true })
          .click();
        await expect(
          workspace.getByRole("button", {
            name: "Bölüm ve videolar",
            exact: true,
          }),
        ).toHaveAttribute("aria-pressed", "true");
      },
    },
    {
      alias: "state-people-search-empty",
      path: "/admin/people",
      prepare: async (page) => {
        const workspace = region(page, "Hakkımızda içerik düzenleyici");
        await workspace
          .getByLabel("Kişi veya bölüm ara", { exact: true })
          .fill("DEMO-bulunamayan-kişi");
        await expect(
          workspace.getByText("Aramaya uygun kişi veya bölüm yok.", {
            exact: true,
          }),
        ).toBeVisible();
      },
    },
    {
      alias: "state-people-delete-dialog",
      path: "/admin/people",
      prepare: async (page) => {
        const details = await firstPersonDetails(page);
        await details
          .getByRole("button", { name: "Kişiyi sil", exact: true })
          .click();
        await expect(
          page.getByRole("dialog", { name: "Kişiyi sil", exact: true }),
        ).toBeVisible();
      },
    },
    {
      alias: "state-site-game-preview",
      path: "/admin/oyunlar",
      prepare: async (page) => {
        const catalog = await selectSiteGame(page);
        await catalog
          .getByRole("textbox", { name: "Oyun açıklaması", exact: true })
          .fill("DEMO kaydedilmemiş oyun kartı önizlemesi.");
        const preview = region(page, "Oyun kartı önizleme");
        await preview.scrollIntoViewIfNeeded();
        await expect(
          preview.getByText("DEMO kaydedilmemiş oyun kartı önizlemesi.", {
            exact: true,
          }),
        ).toBeVisible();
      },
    },
    {
      alias: "state-site-game-delete-dialog",
      path: "/admin/oyunlar",
      prepare: async (page) => {
        const catalog = await selectSiteGame(page);
        await catalog
          .getByRole("button", { name: "Oyunu sil", exact: true })
          .click();
        await expect(
          page.getByRole("dialog", { name: "Oyunu sil", exact: true }),
        ).toBeVisible();
      },
    },
    {
      alias: "state-archive-preview",
      path: "/admin/ulujam-arsivleri",
      prepare: async (page) => {
        const workspace = region(page, "UluJam arşiv düzenleyici");
        await workspace
          .getByRole("button", { name: "UluJam 2026 düzenle", exact: true })
          .click();
        await workspace.getByText("Arşiv önizlemesi", { exact: true }).click();
        await workspace
          .getByText("Arşiv önizlemesi", { exact: true })
          .scrollIntoViewIfNeeded();
        await expect(workspace.locator("details[open]")).toHaveCount(1);
      },
    },
    {
      alias: "state-system-retry-confirmation",
      path: "/admin/sistem",
      prepare: async (page) => {
        const job = region(page, "Sistem operasyonları").getByRole("article", {
          name: "Wallet eşitleme",
          exact: true,
        });
        await job
          .getByRole("button", { name: "İşi yeniden dene", exact: true })
          .click();
        const confirmation = job.getByRole("region", {
          name: "İşlem etki önizlemesi",
          exact: true,
        });
        await confirmation.scrollIntoViewIfNeeded();
        await expect(confirmation).toBeVisible();
      },
    },
    {
      alias: "state-photo-hover",
      path: "/hakkimizda",
      pointer: "hover",
      hoverTarget: (page) => page.locator("[data-gallery-photo]").first(),
      prepare: async (page) => {
        const photo = page.locator("[data-gallery-photo]").first();
        await photo.hover();
        await expect(photo).toBeVisible();
      },
    },
    {
      alias: "state-photo-focus",
      path: "/hakkimizda",
      prepare: async (page) => {
        const photo = page.locator("[data-gallery-photo]").first();
        await photo.focus();
        await photo.scrollIntoViewIfNeeded();
        await expect(photo).toBeFocused();
      },
    },
    {
      alias: "state-photo-dialog",
      path: "/hakkimizda",
      prepare: async (page) => {
        await page.locator("[data-gallery-photo]").first().click();
        const dialog = page.getByRole("dialog", {
          name: "Fotoğraf galerisi",
          exact: true,
        });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole("img")).toBeVisible();
      },
    },
    {
      alias: "state-carousel-second-keyboard-paused",
      path: "/",
      prepare: async (page) => {
        const carousel = region(page, "Geçmiş etkinlikler galerisi");
        await carousel.scrollIntoViewIfNeeded();
        const track = carousel.getByRole("group", {
          name: "Etkinlikleri kaydır",
          exact: true,
        });
        await track.focus();
        await track.press("ArrowRight");
        await expect(
          carousel.getByRole("button", {
            name: "Otomatik geçişi başlat",
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          carousel.locator(
            '[aria-roledescription="slayt"][aria-hidden="false"]',
          ),
        ).toHaveAttribute("aria-label", /^2 \/ /);
        await expect
          .poll(() =>
            track.evaluate((element) =>
              Math.abs(element.scrollLeft - element.clientWidth),
            ),
          )
          .toBeLessThan(1);
      },
    },
  ];
}
