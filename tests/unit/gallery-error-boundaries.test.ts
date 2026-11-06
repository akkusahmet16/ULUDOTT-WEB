import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { UlujamArchive } from "../../src/modules/events/ui/ulujam-archive.tsx";
import { ContentView } from "../../src/modules/publication/ui/content-view.tsx";
import { PublicGame } from "../../src/modules/games/ui/public-game.tsx";
import { ResultCard } from "../../src/modules/games/ui/result-card.tsx";
import AdminError from "../../src/app/admin/error.tsx";
import AdminLoading from "../../src/app/admin/loading.tsx";
import { countdownState } from "../../src/modules/events/ui/countdown.tsx";
import type { ArchiveFields } from "../../src/modules/site-settings/domain/archives.ts";
import type { PublicContent } from "../../src/modules/publication/domain.ts";
import type { PublicGameView } from "../../src/modules/games/infrastructure/game-repository.ts";
import type { HistoricalResult } from "../../src/modules/games/domain/historical-result.ts";
import { I18nProvider } from "../../src/i18n/client.tsx";
import { CLIENT_NAMESPACES, type Locale } from "../../src/i18n/config.ts";
import { getDictionarySlice } from "../../src/i18n/server.ts";

function renderWithI18n(locale: Locale, node: React.ReactNode): string {
  const slice = getDictionarySlice(locale, CLIENT_NAMESPACES);
  return renderToStaticMarkup(
    createElement(I18nProvider, { locale, dictionary: slice, children: node }),
  );
}

describe("Faz 5 / İş 5A — Mevcut galeri ve hata durumlarının korunması (Birim / DOM Sınırları)", () => {
  describe("UlujamArchive galeri mozaik düzeni, başlık/alt metin ve Issue #1 yeni lightbox yokluğu", () => {
    const sampleArchive: ArchiveFields = {
      year: 2026,
      description: "UluJam 2026 maratonu başarıyla tamamlandı.",
      position: 10,
      published: true,
      gallery: [
        {
          src: "/community/02-ulujam/2026-arsiv/ulujam-2026-galeri-01.webp",
          alt: "UluJam 2026 açılış seremonisi ve takımların toplanması",
        },
        {
          src: "/community/02-ulujam/2026-arsiv/ulujam-2026-galeri-02.webp",
          alt: "Katılımcılar prototip geliştirirken",
        },
        {
          src: "/community/02-ulujam/2026-arsiv/ulujam-2026-galeri-03.webp",
          alt: "Jüri sunumları ve ödül töreni",
        },
      ],
      games: [
        {
          rank: 2,
          title: "Kayıp Ruh",
          team: "Ruh Takımı",
          image: "/media/game-2.webp",
          itchUrl: "https://itch.io/kayip-ruh",
          description: "İkinci olan atmosferik macera oyunu.",
        },
        {
          rank: 1,
          title: "Kayıp Parçalar",
          team: "Parça Ekibi",
          image: "/media/game-1.webp",
          itchUrl: "https://itch.io/kayip-parcalar",
          description: "Birinci olan bulmaca platform oyunu.",
        },
        {
          rank: 3,
          title: "Proje SW",
          team: "SW Ekibi",
          image: "/media/game-3.webp",
          itchUrl: "https://itch.io/proje-sw",
          description: "Üçüncü olan retro aksiyon oyunu.",
        },
      ],
    };

    it("galeri mozaik düzenini (featured + side), başlık/alt metin hiyerarşisini ve derece sıralamasını v0.1 ile tam uyumlu üretir", () => {
      const trHtml = renderWithI18n(
        "tr",
        createElement(UlujamArchive, { archive: sampleArchive, locale: "tr" }),
      );

      // Mozaik kapsayıcı ve sınıflar
      expect(trHtml).toContain('class="archive-gallery-mosaic"');
      expect(trHtml).toContain(
        'class="archive-gallery-item archive-gallery-featured"',
      );
      expect(trHtml).toContain(
        'class="archive-gallery-item archive-gallery-side"',
      );

      // Figcaption, eyebrow ve alt metin konumlandırması
      expect(trHtml).toContain('class="eyebrow">UluJam 2026 / 01<');
      expect(trHtml).toContain('class="eyebrow">UluJam 2026 / 02<');
      expect(trHtml).toContain('class="eyebrow">UluJam 2026 / 03<');
      expect(trHtml).toContain(
        "<span>UluJam 2026 açılış seremonisi ve takımların toplanması</span>",
      );

      // Responsive sizes sözleşmesi: 1. görsel 67vw, yan görseller 33vw
      expect(trHtml).toContain(
        'sizes="(max-width: 699px) 100vw, (max-width: 1500px) 67vw, 960px"',
      );
      expect(trHtml).toContain(
        'sizes="(max-width: 699px) 100vw, (max-width: 1500px) 33vw, 460px"',
      );

      // Dereceye giren oyunlar: rank sıralaması 1, 2, 3 olarak artan düzende olmalıdır (input sırası 2, 1, 3 idi)
      const rank1Pos = trHtml.indexOf("Kayıp Parçalar");
      const rank2Pos = trHtml.indexOf("Kayıp Ruh");
      const rank3Pos = trHtml.indexOf("Proje SW");
      expect(rank1Pos).toBeGreaterThan(-1);
      expect(rank2Pos).toBeGreaterThan(rank1Pos);
      expect(rank3Pos).toBeGreaterThan(rank2Pos);

      // Harici itch.io linki sözleşmesi
      expect(trHtml).toContain('href="https://itch.io/kayip-parcalar"');
      expect(trHtml).toContain('target="_blank"');
      expect(trHtml).toContain('rel="noopener noreferrer"');
    });

    it("Issue #1 yeni lightbox gereğini görsel kilit nedeniyle kesinlikle içermez (açık fark sözleşmesi)", () => {
      const html = renderWithI18n(
        "tr",
        createElement(UlujamArchive, { archive: sampleArchive, locale: "tr" }),
      );

      // Lightbox ile ilgili hiçbir modal, diyalog, popover veya tetikleyici bulunmamalıdır
      expect(html).not.toContain("lightbox");
      expect(html).not.toContain('role="dialog"');
      expect(html).not.toContain('aria-modal="true"');
      expect(html).not.toContain("modal");
      expect(html).not.toContain("overlay");
      expect(html).not.toContain("popup");

      // Görseller tıklama/modal tetikleyici buton içine sarmalanmamalıdır
      expect(html).not.toMatch(/<button[^>]*>\s*<img/i);
    });

    it("boş galeri ve boş oyun dizisinde uygun erişilebilir mesajları TR ve EN dillerinde sunar", () => {
      const emptyArchive: ArchiveFields = {
        year: 2025,
        description: "",
        position: 20,
        published: true,
        gallery: [],
        games: [],
      };

      const trHtml = renderWithI18n(
        "tr",
        createElement(UlujamArchive, { archive: emptyArchive, locale: "tr" }),
      );
      expect(trHtml).toContain(
        '<p class="empty">Henüz doğrulanmış arşiv görseli yok.</p>',
      );
      expect(trHtml).toContain(
        '<p class="empty">Henüz yayımlanmış derece bağlantısı yok.</p>',
      );
      expect(trHtml).not.toContain('class="archive-gallery-mosaic"');

      const enHtml = renderWithI18n(
        "en",
        createElement(UlujamArchive, { archive: emptyArchive, locale: "en" }),
      );
      expect(enHtml).toContain(
        '<p class="empty">No verified archive images yet.</p>',
      );
      expect(enHtml).toContain(
        '<p class="empty">No published winning links yet.</p>',
      );
    });
  });

  describe("ContentView sınır ve eksik veri durumları", () => {
    const baseContent: PublicContent = {
      id: "c0000000-0000-4000-8000-000000000001",
      title: "Unity ile 3D Modelleme Atölyesi",
      slug: "unity-3d-modelleme-atolyesi",
      excerpt: "Pratik modelleme ve import teknikleri.",
      description: "Atölye detaylı açıklaması.",
      body: "Atölye gövde metni.",
      kind: "general",
      categoryId: null,
      location: null,
      locationType: "physical",
      organizer: null,
      startsAt: null,
      endsAt: null,
      publishAt: new Date("2026-01-01T00:00:00Z"),
      unpublishAt: null,
      status: "published",
      displayStatus: "published",
      revision: 1,
      capacity: null,
      maxTeamSize: 1,
      mediaId: null,
      formId: null,
      eventId: null,
      ctaUrl: null,
      ctaLabel: null,
      seo: {},
      featuredPosition: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      applicationUrl: null,
      image: null,
    };

    it("tarih, konum, görsel ve başvuru adresi eksik olduğunda TBD metinlerini ve temiz yapıyı üretir", () => {
      const trHtml = renderWithI18n(
        "tr",
        createElement(ContentView, {
          item: baseContent,
          type: "event",
          locale: "tr",
        }),
      );

      // Görsel yok
      expect(trHtml).not.toContain("<picture");
      expect(trHtml).not.toContain("<img");
      expect(trHtml).not.toContain("event-poster");

      // Tarih ve konum TBD
      expect(trHtml).toContain("Tarih henüz belirlenmedi (İstanbul)");
      expect(trHtml).toContain("Konum henüz belirlenmedi");

      // Organizatör ve kapasite yoksa basılmaz
      expect(trHtml).not.toContain("Düzenleyen:");
      expect(trHtml).not.toContain("Kapasite:");

      // Başvuru butonu yok
      expect(trHtml).not.toContain('class="button"');

      // EN dili TBD kontrolü
      const enHtml = renderWithI18n(
        "en",
        createElement(ContentView, {
          item: baseContent,
          type: "event",
          locale: "en",
        }),
      );
      expect(enHtml).toContain("Date to be announced (Istanbul)");
      expect(enHtml).toContain("Location to be announced");
    });

    it("tüm alanlar dolu olduğunda posteri, saat dilimli tarih aralığını, organizatörü ve başvuru linkini eksiksiz sunar", () => {
      const fullContent: PublicContent = {
        ...baseContent,
        image: {
          id: "m0000000-0000-4000-8000-000000000001",
          altText: "Atölye Afişi",
          width: 1200,
          height: 675,
        },
        startsAt: new Date("2026-03-15T10:00:00+03:00"),
        endsAt: new Date("2026-03-15T14:00:00+03:00"),
        location: "Görükle Kampüsü İİBF Konferans Salonu",
        organizer: "Uludott Etkinlik Ekibi",
        capacity: 80,
        applicationUrl: "/basvuru/unity-atolyesi",
      };

      const trHtml = renderWithI18n(
        "tr",
        createElement(ContentView, {
          item: fullContent,
          type: "event",
          locale: "tr",
        }),
      );

      expect(trHtml).toContain('class="event-poster"');
      expect(trHtml).toContain('alt="Atölye Afişi"');
      expect(trHtml).toContain('src="/media/m0000000-0000-4000-8000-000000000001"');
      expect(trHtml).toContain("Görükle Kampüsü İİBF Konferans Salonu");
      expect(trHtml).toContain("Düzenleyen: Uludott Etkinlik Ekibi");
      expect(trHtml).toContain("Kapasite: 80");
      expect(trHtml).toContain('(İstanbul)');
      expect(trHtml).toContain('href="/basvuru/unity-atolyesi"');
      expect(trHtml).toContain(">Başvur<");
    });

    it("duyuru tipinde cta butonu ve etkinlik bağıntısı sınır durumlarını doğru yönetir", () => {
      const announcement: PublicContent = {
        ...baseContent,
        body: "Önemli duyuru metni.",
        ctaUrl: "https://discord.gg/uludott",
        ctaLabel: "Discord'a Katıl",
        eventId: "e0000000-0000-4000-8000-000000000001",
      };

      const trHtml = renderWithI18n(
        "tr",
        createElement(ContentView, {
          item: announcement,
          type: "announcement",
          locale: "tr",
        }),
      );

      expect(trHtml).toContain("Önemli duyuru metni.");
      expect(trHtml).toContain('href="https://discord.gg/uludott"');
      expect(trHtml).toContain("Discord&#x27;a Katıl");
      expect(trHtml).toContain("Bu duyuru bir etkinlikle ilişkilidir.");
    });
  });

  describe("PublicGame ve ResultCard sınır ve editöryal durumları", () => {
    it("PublicGame derecesiz/finalist olmayan ve görseli bulunmayan oyunları eksiksiz render eder", () => {
      const minimalGame: PublicGameView = {
        id: "g0000000-0000-4000-8000-000000000001",
        slug: "minimal-game",
        title: "Minimal Game",
        eventTitle: "UluJam 2026",
        teamName: "Bağımsız Geliştirici",
        description: "Tek kişilik yapım.\nİkinci satır.",
        itchUrl: "https://itch.io/minimal",
        credits: ["Ali Veli", "Ayşe Can"],
        rank: null,
        finalist: false,
        image: null,
      };

      const trHtml = renderWithI18n(
        "tr",
        createElement(PublicGame, { game: minimalGame, locale: "tr" }),
      );

      // Derece veya finalist rozeti olmamalı
      expect(trHtml).not.toContain("1. derece");
      expect(trHtml).not.toContain("Finalist");
      expect(trHtml).toContain('<p class="eyebrow">UluJam 2026</p>');

      // Görsel yok
      expect(trHtml).not.toContain("<img");

      // Pre-wrap ve künye birleştirme
      expect(trHtml).toContain('style="white-space:pre-wrap"');
      expect(trHtml).toContain("Yapımcılar: Ali Veli · Ayşe Can");
      expect(trHtml).toContain('rel="noopener noreferrer external"');
    });

    it("PublicGame derece ve finalistlik bulunan oyunlarda tüm rozetleri ve görseli sunar", () => {
      const featuredGame: PublicGameView = {
        id: "g0000000-0000-4000-8000-000000000002",
        slug: "super-game",
        title: "Süper Oyun",
        eventTitle: "UluJam 2026",
        teamName: "Şampiyonlar",
        description: "Şampiyon oyun açıklaması.",
        itchUrl: "https://itch.io/super",
        credits: ["Geliştirici 1"],
        rank: 1,
        finalist: true,
        image: {
          url: "/media/super-variant",
          alt: "Süper Oyun Afişi",
        },
      };

      const trHtml = renderWithI18n(
        "tr",
        createElement(PublicGame, { game: featuredGame, locale: "tr" }),
      );

      expect(trHtml).toContain("UluJam 2026 · 1. derece · Finalist");
      expect(trHtml).toContain('alt="Süper Oyun Afişi"');
      expect(trHtml).toContain('src="/media/super-variant"');
    });

    it("ResultCard tam yayınlanmış oyun ile kısmi tarihî arşivi ayırt eder", () => {
      // Tam yayınlanmış oyun (slug var)
      const fullResult: PublicGameView = {
        id: "r0000000-0000-4000-8000-000000000001",
        slug: "yayinlanmis-oyun",
        title: "Yayınlanmış Oyun",
        eventTitle: "UluJam 2026",
        teamName: "Grup A",
        description: "Açıklama",
        itchUrl: "https://itch.io/a",
        credits: ["Mehmet", "Fatma"],
        rank: 1,
        finalist: true,
        image: null,
      };

      const fullHtml = renderWithI18n(
        "tr",
        createElement(ResultCard, { result: fullResult, locale: "tr" }),
      );
      expect(fullHtml).toContain("1. derece");
      expect(fullHtml).toContain('href="/oyunlar/yayinlanmis-oyun"');
      expect(fullHtml).toContain(">Oyun ayrıntıları<");

      // Kısmi tarihî sonuç (slug yok, yalnızca derece ve itch linki)
      const partialResult: HistoricalResult = {
        id: "h0000000-0000-4000-8000-000000000002",
        year: 2024,
        rank: 2,
        itchUrl: "https://subzero.itch.io/old-game",
        status: "historical_partial",
        title: null,
        team: null,
        credits: null,
        image: null,
        description: null,
      };

      const partialHtml = renderWithI18n(
        "tr",
        createElement(ResultCard, { result: partialResult, locale: "tr" }),
      );
      expect(partialHtml).toContain("Kısmi editoryal kayıt");
      expect(partialHtml).toContain("2. derece");
      expect(partialHtml).toContain(
        "Oyun adı, takım, yapımcılar, görsel ve açıklama henüz yayımlanmadı.",
      );
      expect(partialHtml).toContain('href="https://subzero.itch.io/old-game"');
      expect(partialHtml).toContain("2. derece oyununu itch.io’da aç");
      expect(partialHtml).toContain(" (yeni sekmede)");
    });
  });

  describe("Countdown zamanlayıcı durumları", () => {
    it("tarihsiz, gelecek tarihli ve geçmiş/başlamış durumları tam olarak sınıflandırır", () => {
      const now = new Date("2026-05-01T12:00:00.000Z");

      // Tarih yok veya geçersiz
      expect(countdownState(null, now)).toEqual({ kind: "coming_soon" });
      expect(countdownState(new Date("invalid"), now)).toEqual({
        kind: "coming_soon",
      });

      // Gelecek tarihli
      const future = new Date("2026-05-01T12:01:30.000Z");
      expect(countdownState(future, now)).toEqual({
        kind: "counting",
        seconds: 90,
      });

      // Tam başladığı an ve geçmiş an
      expect(countdownState(now, now)).toEqual({ kind: "started" });
      const past = new Date("2026-04-30T12:00:00.000Z");
      expect(countdownState(past, now)).toEqual({ kind: "started" });
    });
  });

  describe("Admin hata ve yükleme yüzeyleri — rol erişilebilirliği ve sır sızdırmama güvencesi", () => {
    it("AdminError role='alert' içerir, retry çağrısını tetikler ve hiçbir yığın/sır sızdırmaz", () => {
      let retried = false;
      const html = renderToStaticMarkup(
        createElement(AdminError, {
          retry: () => {
            retried = true;
          },
        }),
      );

      // Başlık ve rol kontrolü
      expect(html).toContain("<h1>Yönetim ekranı açılamadı</h1>");
      expect(html).toContain('role="alert"');
      expect(html).toContain(
        "İşlem şu anda tamamlanamadı. Lütfen yeniden deneyin.",
      );
      expect(html).toContain("<button>Ekranı yeniden yükle</button>");

      // Güvenlik ve sır sızdırmama
      expect(html).not.toContain("Error:");
      expect(html).not.toContain("stack");
      expect(html).not.toContain("postgres://");
      expect(html).not.toContain("SESSION_SECRET");
      expect(html).not.toContain("node_modules");

      // Retry fonksiyonu doğrudan çalıştırılabilir
      const errorElement = AdminError({
        retry: () => {
          retried = true;
        },
      });
      expect(errorElement.type).toBe("main");
      expect(retried).toBe(false);
      const buttonChild = errorElement.props.children[2];
      buttonChild.props.onClick();
      expect(retried).toBe(true);
    });

    it("AdminLoading role='status' ve aria-live='polite' semantiği ile kullanıcıyı bilgilendirir", () => {
      const html = renderToStaticMarkup(createElement(AdminLoading));

      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain("Yönetim ekranı yükleniyor…");
    });
  });
});
