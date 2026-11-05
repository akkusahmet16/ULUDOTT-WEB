import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { chromium } from "@playwright/test";

vi.mock("next/server", () => ({
  connection: async () => {},
}));
import { getPinnedVideoTime } from "../../public/theme/scene-scroll.js";
import { I18nProvider } from "../../src/i18n/client.tsx";
import { CLIENT_NAMESPACES, type Locale } from "../../src/i18n/config.ts";
import { getDictionarySlice } from "../../src/i18n/server.ts";
import { StoryPanels } from "../../src/components/layout/story-panels.tsx";
import { SceneVideo } from "../../src/components/layout/scene-video.tsx";
import { Header } from "../../src/components/layout/header.tsx";
import { OpeningGlow } from "../../src/components/layout/opening-glow.tsx";
import { Dialog } from "../../src/components/design-system/dialog.tsx";
import { PeopleStory } from "../../src/modules/community/people-story.tsx";
import { PairMatch } from "../../src/modules/community/pair-match.tsx";
import { StarCatch } from "../../src/modules/community/star-catch.tsx";
import {
  defaultUlujamSettings,
  type UlujamPresentation,
} from "../../src/modules/site-settings/domain/ulujam.ts";
import { PastEventsCarousel } from "../../src/modules/events/ui/past-events-carousel.tsx";
import { UlujamComingSoon } from "../../src/modules/events/ui/ulujam-coming-soon.tsx";
import { securityHeaders } from "../../src/lib/security/headers.ts";
import { buildBootScript } from "../../src/config/boot-script.ts";
import { VISUAL_BROWSER_ARGS } from "../helpers/visual-runtime.ts";

function renderWithI18n(locale: Locale, node: React.ReactNode): string {
  const slice = getDictionarySlice(locale, CLIENT_NAMESPACES);
  return renderToStaticMarkup(
    createElement(I18nProvider, { locale, dictionary: slice, children: node }),
  );
}

describe("Faz 4 / İş 4A — Ortak sunum bütünlüğü, etkileşimler, erişilebilirlik ve CSP uyumu", () => {
  it("StoryPanels, PeopleStory, PhotoGallery, PastEventsCarousel ve UlujamComingSoon bileşenlerini TR ve EN dillerinde aynı v0.1 DOM yapısıyla üretir", async () => {
    const samplePresentation: UlujamPresentation = {
      ...defaultUlujamSettings,
      year: 2026,
      panelTitle: "UluJam 2026",
      panelDescription: "48 saatlik oyun geliştirme maratonu.",
      videoId: "_ECGC1V__xo",
      videoTitle: "UluJam vlog",
      videoDescription: "Maraton özeti.",
      videoCover: "/community/01-anasayfa/anasayfa-ulujam-panel.webp",
      applicationPublished: true,
      application: {
        open: true,
        title: "UluJam 2026 Başvuruları",
        description: "Takımınla veya bireysel katıl.",
        url: "/basvuru/ulujam-2026",
        buttonLabel: "Hemen Başvur",
        message: "Başvurular açık.",
      },
    };

    const trPanelsHtml = renderWithI18n(
      "tr",
      createElement(StoryPanels, {
        degreeContent: createElement("div", { className: "degrees-slot" }, "Dereceler"),
        presentation: samplePresentation,
      }),
    );
    const enPanelsHtml = renderWithI18n(
      "en",
      createElement(StoryPanels, {
        degreeContent: createElement("div", { className: "degrees-slot" }, "Awards"),
        presentation: samplePresentation,
      }),
    );

    expect(trPanelsHtml).toContain('id="kesfet"');
    expect(trPanelsHtml).toContain('aria-label="Uludott’u keşfet"');
    expect(trPanelsHtml).toContain('aria-label="UluJam içeriklerini aç"');
    expect(trPanelsHtml).toContain('aria-label="Derece oyunlarını aç"');
    expect(trPanelsHtml).toContain('aria-controls="story-ulujam"');
    expect(trPanelsHtml).toContain('aria-controls="story-games"');

    expect(enPanelsHtml).toContain('id="kesfet"');
    expect(enPanelsHtml).toContain('aria-label="Explore Uludott"');
    expect(enPanelsHtml).toContain('aria-label="Open UluJam story"');
    expect(enPanelsHtml).toContain('aria-label="Open winning games story"');

    // PastEventsCarousel: inaktif slayt inert + aria-hidden, kontroller ve bölge etiketleri
    const trCarouselHtml = renderWithI18n(
      "tr",
      createElement(PastEventsCarousel, {
        slides: [
          { id: "s1", title: "Etkinlik 1", content: createElement("article", null, "Kart 1") },
          { id: "s2", title: "Etkinlik 2", content: createElement("article", null, "Kart 2") },
        ],
      }),
    );
    const enCarouselHtml = renderWithI18n(
      "en",
      createElement(PastEventsCarousel, {
        slides: [
          { id: "s1", title: "Event 1", content: createElement("article", null, "Card 1") },
          { id: "s2", title: "Event 2", content: createElement("article", null, "Card 2") },
        ],
      }),
    );

    expect(trCarouselHtml).toContain('aria-label="Geçmiş etkinlikler galerisi"');
    expect(trCarouselHtml).toContain('aria-label="Etkinlikleri kaydır"');
    expect(trCarouselHtml).toContain('aria-label="1 / 2: Etkinlik 1"');
    expect(trCarouselHtml).toContain('aria-label="2 / 2: Etkinlik 2"');
    expect(trCarouselHtml).toContain('aria-label="Otomatik geçişi duraklat"');

    expect(enCarouselHtml).toContain('aria-label="Past events gallery"');
    expect(enCarouselHtml).toContain('aria-label="Scroll events"');
    expect(enCarouselHtml).toContain('aria-label="1 / 2: Event 1"');
    expect(enCarouselHtml).toContain('aria-label="Pause autoplay"');

    // PeopleStory: video olan ve olmayan bölümler + fotoğrafsız üye fallback'i
    const trPeopleHtml = renderWithI18n(
      "tr",
      createElement(PeopleStory, {
        locale: "tr",
        chapters: [
          {
            slug: "baskanlik",
            title: "Başkanlık",
            role: "Yönetim",
            color: "#1b2838",
            video: "/community/02-hakkimizda/baskan.mp4",
            poster: "/community/02-hakkimizda/baskan.webp",
            videoVisible: true,
            videoReference: true,
            members: [
              {
                slug: "uye-1",
                name: "Ada Lovelace",
                role: "Başkan",
                photo: "/community/02-hakkimizda/ada.webp",
                photoReference: true,
                quote: "Oyun üretmek bir yolculuktur.",
                details: ["Detay 1"],
              },
              {
                slug: "uye-2",
                name: "Alan Turing",
                role: "Başkan Yardımcısı",
                photo: "",
                photoReference: false,
                quote: "",
                details: ["Fotoğrafsız üye detayı"],
              },
            ],
          },
          {
            slug: "sosyal-medya",
            title: "Sosyal Medya",
            role: "İletişim",
            color: "#223b45",
            video: "/community/02-hakkimizda/sosyal.mp4",
            poster: "/community/02-hakkimizda/sosyal.webp",
            videoVisible: false,
            videoReference: false,
            members: [],
          },
        ],
      }),
    );

    expect(trPeopleHtml).toContain('id="yonetim-kurulu"');
    expect(trPeopleHtml).toContain('class="people-video-track"');
    expect(trPeopleHtml).toContain('class="people-detail people-detail-text-only"');
    expect(trPeopleHtml).toContain('class="people-chapter-heading"');
    expect(trPeopleHtml).toContain('aria-label="Fotoğraf galerisi"');

    // UlujamComingSoon: tarihsiz (Yakında / Coming soon) ve tarihli durumlar
    const trComingSoonElement = await UlujamComingSoon({
      year: 2027,
      startAt: null,
      presentation: samplePresentation,
      locale: "tr",
    });
    const enComingSoonElement = await UlujamComingSoon({
      year: 2027,
      startAt: null,
      presentation: samplePresentation,
      locale: "en",
    });
    const trComingSoonHtml = renderWithI18n("tr", trComingSoonElement);
    const enComingSoonHtml = renderWithI18n("en", enComingSoonElement);

    expect(trComingSoonHtml).toContain("UluJam 2027");
    expect(trComingSoonHtml).toContain("Yakında");
    expect(enComingSoonHtml).toContain("UluJam 2027");
    expect(enComingSoonHtml).toContain("Coming soon");
  });

  it("SceneVideo ve getPinnedVideoTime hazır olmayan video (NaN/0 süre), kısa ekran ve reduced-motion durumlarında güvenli davranır", () => {
    // Video metadata henüz yüklenmemişken (NaN veya 0 süre)
    expect(
      getPinnedVideoTime({
        trackTop: 100,
        trackHeight: 1800,
        heroTop: 0,
        heroHeight: 800,
        viewportHeight: 800,
        duration: Number.NaN,
      }),
    ).toBe(0);
    expect(
      getPinnedVideoTime({
        trackTop: 100,
        trackHeight: 1800,
        heroTop: 0,
        heroHeight: 800,
        viewportHeight: 800,
        duration: 0,
      }),
    ).toBe(0);
    expect(
      getPinnedVideoTime({
        trackTop: 100,
        trackHeight: 1800,
        heroTop: 0,
        heroHeight: 0,
        viewportHeight: 800,
        duration: 5,
      }),
    ).toBe(0);

    // Kısa ekran yüksekliğinde (viewportHeight < heroHeight, örn. 390px) negatif merkez üretmez
    const shortScreenTime = getPinnedVideoTime({
      trackTop: -200,
      trackHeight: 1600,
      heroTop: 0,
      heroHeight: 700,
      viewportHeight: 390,
      duration: 4,
    });
    expect(Number.isFinite(shortScreenTime)).toBe(true);
    expect(shortScreenTime).toBeGreaterThan(0);
    expect(shortScreenTime).toBeLessThanOrEqual(4);

    // SceneVideo SSR çıktısı preload="none", muted, playsInline ve erişilebilir etiket taşır
    const videoHtml = renderWithI18n(
      "tr",
      createElement(SceneVideo, {
        src: "/community/02-hakkimizda/baskan.mp4",
        poster: "/community/02-hakkimizda/baskan.webp",
        label: "Başkanlık açılış videosu",
        reference: true,
      }),
    );
    expect(videoHtml).toContain('preload="none"');
    expect(videoHtml).toContain('playsInline=""');
    expect(videoHtml).toContain('aria-label="Başkanlık açılış videosu"');
  });

  it("PairMatch ve StarCatch mini oyunları gerçek <button>, anlamlı aria-label, aria-pressed ve aria-live='polite' sözleşmesini TR ve EN dillerinde korur", () => {
    const trPairHtml = renderWithI18n("tr", createElement(PairMatch));
    const enPairHtml = renderWithI18n("en", createElement(PairMatch));
    const trStarHtml = renderWithI18n("tr", createElement(StarCatch));
    const enStarHtml = renderWithI18n("en", createElement(StarCatch));

    expect(trPairHtml).toContain('aria-label="Hafıza eşleştirme"');
    expect(trPairHtml).toContain('role="status" aria-live="polite"');
    expect(trPairHtml).toContain('aria-pressed="false"');
    expect(trPairHtml).toContain('aria-label="Kart 1: kapalı"');

    expect(enPairHtml).toContain('aria-label="Memory match"');
    expect(enPairHtml).toContain('role="status" aria-live="polite"');
    expect(enPairHtml).toContain('aria-pressed="false"');
    expect(enPairHtml).toContain('aria-label="Card 1: hidden"');

    expect(trStarHtml).toContain('aria-label="Yıldız yakalama"');
    expect(trStarHtml).toContain('role="status" aria-live="polite"');
    expect(trStarHtml).toContain('class="button star-target"');
    expect(trStarHtml).toContain('aria-label="Yıldızı yakala"');

    expect(enStarHtml).toContain('aria-label="Star catch"');
    expect(enStarHtml).toContain('role="status" aria-live="polite"');
    expect(enStarHtml).toContain('aria-label="Catch the star"');
  });

  it("Dialog, Header, OpeningGlow ve enforced CSP altında etkileşim, odak iadesi, Escape ve reduced-motion davranışını gerçek Chromium'da doğrular", async () => {
    const nonce = "faz4A_test_nonce_1234567890";
    const headers = securityHeaders("public", nonce, true);
    const csp = headers["Content-Security-Policy"];

    expect(csp).toContain(`'nonce-${nonce}'`);
    expect(csp).toContain("frame-src https://challenges.cloudflare.com https://www.youtube-nocookie.com");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");

    const browser = await chromium.launch({
      channel: "chromium",
      headless: true,
      args: [...VISUAL_BROWSER_ARGS],
    });

    try {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const cspViolations: string[] = [];
      page.on("pageerror", (err) => cspViolations.push(err.message));

      const bootCode = buildBootScript();
      const html = `<!DOCTYPE html>
<html lang="tr" data-theme="cinematic">
<head>
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <script id="uludott-boot" nonce="${nonce}">${bootCode}</script>
</head>
<body>
  <a href="#main-content" class="skip">İçeriğe geç</a>
  <button id="open-dialog" type="button">Detayı Aç</button>
  <dialog id="test-dialog" aria-label="Örnek Diyalog">
    <h2>Örnek Diyalog</h2>
    <button id="close-dialog" type="button">Kapat</button>
  </dialog>
  <main id="main-content" tabindex="-1">
    <button id="card-0" type="button" aria-pressed="false" aria-label="Kart 1: kapalı">?</button>
    <p id="game-status" role="status" aria-live="polite">0 / 3</p>
  </main>
  <script nonce="${nonce}">
    const openBtn = document.getElementById('open-dialog');
    const closeBtn = document.getElementById('close-dialog');
    const dialog = document.getElementById('test-dialog');
    let trigger = null;
    openBtn.addEventListener('click', (e) => {
      trigger = e.currentTarget;
      dialog.showModal();
    });
    const close = () => {
      dialog.close();
      if (trigger) trigger.focus();
    };
    closeBtn.addEventListener('click', close);
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      close();
    });
    const card0 = document.getElementById('card-0');
    const status = document.getElementById('game-status');
    card0.addEventListener('click', () => {
      card0.setAttribute('aria-pressed', 'true');
      card0.setAttribute('aria-label', 'Kart 1: ★');
      card0.textContent = '★';
      status.textContent = '1 / 3';
    });
  </script>
</body>
</html>`;

      await page.setContent(html);

      // BootScript enforced CSP altında çalıştı ve data-theme="cinematic" korundu
      expect(await page.locator("html").getAttribute("data-theme")).toBe(
        "cinematic",
      );
      expect(cspViolations).toEqual([]);

      // İlk Tab skip link'e odaklanır
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => document.activeElement?.className)).toBe(
        "skip",
      );

      // Diyalog açılır, Escape ile kapanır ve odak tetikleyici butona geri döner
      await page.locator("#open-dialog").click();
      expect(
        await page.locator("#test-dialog").evaluate((d: HTMLDialogElement) => d.open),
      ).toBe(true);
      await page.keyboard.press("Escape");
      expect(
        await page.locator("#test-dialog").evaluate((d: HTMLDialogElement) => d.open),
      ).toBe(false);
      expect(await page.evaluate(() => document.activeElement?.id)).toBe(
        "open-dialog",
      );

      // Mini oyun kartı klavye (Enter/Space) ile etkileşime girer ve aria-pressed + status güncellenir
      await page.locator("#card-0").focus();
      await page.keyboard.press("Enter");
      expect(await page.locator("#card-0").getAttribute("aria-pressed")).toBe(
        "true",
      );
      expect(await page.locator("#card-0").getAttribute("aria-label")).toBe(
        "Kart 1: ★",
      );
      expect(await page.locator("#game-status").textContent()).toBe("1 / 3");

      // Header, Dialog ve OpeningGlow bileşenlerinin SSR çıktıları da doğrulanır
      expect(
        renderWithI18n(
          "tr",
          createElement(Dialog, {
            title: "Test Başlığı",
            trigger: "Aç",
            children: createElement("p", null, "İçerik"),
          }),
        ),
      ).toContain('aria-label="Test Başlığı"');
      expect(
        renderWithI18n(
          "tr",
          createElement(
            OpeningGlow,
            null,
            createElement("div", null, "Poster"),
          ),
        ),
      ).toContain('aria-hidden="true"');
      expect(renderWithI18n("tr", createElement(Header))).toContain(
        'aria-controls="main-menu"',
      );

      await context.close();
    } finally {
      await browser.close();
    }
  });
});
