import { expect, test } from "@playwright/test";
import { COOKIE_KEYS } from "../../src/config/storage-keys.ts";

test.describe("Faz 3 / İş 3A — Dil altyapısı, çerez çözümlemesi, eşzamanlı istek izolasyonu ve /admin TR zorunluluğu E2E", () => {
  test("varsayılan ziyarette <html lang='tr'> ve Türkçe menü/başlık üretir; Accept-Language: en-US ile otomatik EN'ye geçmez", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      locale: "en-US",
      extraHTTPHeaders: {
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const page = await context.newPage();

    try {
      await page.goto("/hakkimizda");
      await expect(page.locator("html")).toHaveAttribute("lang", "tr");
      await expect(page).toHaveTitle("Hakkımızda | ULUDOTT");
      await expect(page.locator("a.skip")).toHaveText("İçeriğe geç");
      await expect(page.locator(".menu-toggle .menu-label")).toHaveText("Menü");
      await expect(page.locator(".header-page-name")).toHaveText("Hakkımızda");

      // Görünür bir dil değiştirme kontrolü eklenmediğini doğrular
      await expect(
        page.locator('[data-testid*="lang"], [aria-label*="Dil"], [aria-label*="Language"]'),
      ).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test("geçersiz dil çerezi (uludott-lang=de) hata fırlatmadan varsayılan 'tr' diline düşer", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    const targetUrl = new URL(baseURL ?? "http://127.0.0.1:3000");
    await context.addCookies([
      {
        name: COOKIE_KEYS.locale,
        value: "de",
        domain: targetUrl.hostname,
        path: "/",
      },
    ]);
    const page = await context.newPage();

    try {
      const response = await page.goto("/hakkimizda");
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", "tr");
      await expect(page).toHaveTitle("Hakkımızda | ULUDOTT");
    } finally {
      await context.close();
    }
  });

  test("geçerli uludott-lang=en çerezi Türkçe URL'leri değiştirmeden <html lang='en'>, İngilizce başlık ve İngilizce menü etiketleri üretir", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    const targetUrl = new URL(baseURL ?? "http://127.0.0.1:3000");
    await context.addCookies([
      {
        name: COOKIE_KEYS.locale,
        value: "en",
        domain: targetUrl.hostname,
        path: "/",
      },
    ]);
    const page = await context.newPage();

    try {
      await page.goto("/hakkimizda");
      expect(new URL(page.url()).pathname).toBe("/hakkimizda");
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page).toHaveTitle("About | ULUDOTT");
      await expect(page.locator("a.skip")).toHaveText("Skip to content");
      await expect(page.locator(".menu-toggle .menu-label")).toHaveText("Menu");
      await expect(page.locator(".header-page-name")).toHaveText("About");

      await page.locator(".menu-toggle").click();
      const navLinks = page.locator("#main-menu .menu-row > a");
      await expect(navLinks).toHaveText([
        "Home",
        "About",
        "UluJam",
        "Events",
        "Games",
        "Contact",
      ]);

      // Kanonik URL /en öneki üretmez; /hakkimizda kalır
      const canonicalHref = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href");
      expect(new URL(canonicalHref ?? "").pathname).toBe("/hakkimizda");

      // Faz 3B: Etkinlikler ve İletişim sayfa kromu da EN sözlükten çözülür
      await page.goto("/etkinlikler");
      await expect(page.locator("h1")).toHaveText("Events");
      await expect(
        page.locator('section[aria-label="Upcoming events"] h2'),
      ).toHaveText("Upcoming Events");

      await page.goto("/iletisim");
      await expect(page.locator("h1")).toHaveText("Contact");
      await expect(
        page.locator('section[aria-label="Campus scenes"] h2'),
      ).toHaveText("Places You Can Find Us");
    } finally {
      await context.close();
    }
  });

  test("/admin rotası uludott-lang=en çerezi varken dahi <html lang='tr'> ve data-theme='classic' olarak kalır", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    const targetUrl = new URL(baseURL ?? "http://127.0.0.1:3000");
    await context.addCookies([
      {
        name: COOKIE_KEYS.locale,
        value: "en",
        domain: targetUrl.hostname,
        path: "/",
      },
    ]);
    const page = await context.newPage();

    try {
      await page.goto("/admin/giris");
      await expect(page.locator("html")).toHaveAttribute("lang", "tr");
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        "classic",
      );
    } finally {
      await context.close();
    }
  });

  test("eşzamanlı TR ve EN istekleri birbirinin dil bağlamını kirletmez ve JS kapalıyken görünür dil kontrolü üretmez", async ({
    browser,
    baseURL,
  }) => {
    const targetUrl = new URL(baseURL ?? "http://127.0.0.1:3000");
    const trContext = await browser.newContext({ javaScriptEnabled: false });
    const enContext = await browser.newContext({ javaScriptEnabled: false });
    await enContext.addCookies([
      {
        name: COOKIE_KEYS.locale,
        value: "en",
        domain: targetUrl.hostname,
        path: "/",
      },
    ]);

    const trPage = await trContext.newPage();
    const enPage = await enContext.newPage();

    try {
      await Promise.all([
        trPage.goto("/oyunlar"),
        enPage.goto("/oyunlar"),
      ]);

      await expect(trPage.locator("html")).toHaveAttribute("lang", "tr");
      await expect(enPage.locator("html")).toHaveAttribute("lang", "en");
      await expect(trPage).toHaveTitle("Oyunlar | ULUDOTT");
      await expect(enPage).toHaveTitle("Games | ULUDOTT");
      await expect(trPage.locator("a.skip")).toHaveText("İçeriğe geç");
      await expect(enPage.locator("a.skip")).toHaveText("Skip to content");

      // JS kapalıyken de <noscript> form veya görünür dil değiştirici yoktur
      await expect(trPage.locator("noscript")).toHaveCount(0);
      await expect(enPage.locator("noscript")).toHaveCount(0);
    } finally {
      await trContext.close();
      await enContext.close();
    }
  });
});
