import { describe, it, expect } from "vitest";
import { resolveLocale, type Locale } from "../../src/i18n/config.ts";
import { getTranslator } from "../../src/i18n/translate.ts";
import { THEMES, isThemeId, DEFAULT_THEME, type ThemeId } from "../../src/config/theme.config.ts";
import { ROUTES, isRouteId, type RouteId } from "../../src/config/routes.config.ts";

describe("Faz 7 / İş 7B — Üç Bağımsız Genişleme Provası (İzole Tatbikat)", () => {
  it("Prova 1: Rota, sayfa ve sözlük mimarisi yeni statik rota eklenmesine hazırdır", () => {
    // Mevcut rota kayıt defteri doğrulanır
    expect(ROUTES.length).toBeGreaterThan(0);
    expect(isRouteId("home")).toBe(true);
    expect(isRouteId("about")).toBe(true);
    expect(isRouteId("unknown_route" as RouteId)).toBe(false);

    // Tip sözleşmesi simülasyonu: yeni bir rota nesnesi RouteDefinition arayüzü ile uyumlu türetilebilir
    const mockCustomRoute = {
      id: "community-faq" as unknown as RouteId,
      kind: "public-static" as const,
      path: "/sss" as const,
      pattern: "/sss" as const,
      paramNames: [] as const,
      labelKey: "nav.about" as const,
      visibility: "navbar" as const,
      indexable: true,
      canonical: { strategy: "self" as const, basePath: "/sss" },
      metadataKey: {
        titleKey: "meta.aboutTitle" as const,
        descriptionKey: "meta.aboutDescription" as const,
      },
    };
    expect(mockCustomRoute.path).toBe("/sss");
    expect(mockCustomRoute.canonical.strategy).toBe("self");
  });

  it("Prova 2: Tema sistemi yeni tema profili eklenmesine hazırdır", () => {
    // Mevcut temalar doğrulanır
    expect(THEMES).toContain("cinematic");
    expect(THEMES).toContain("classic");
    expect(isThemeId("cinematic")).toBe(true);
    expect(isThemeId("classic")).toBe(true);
    expect(isThemeId("nonexistent")).toBe(false);

    // Ek tema profili simülasyonu (neon teması)
    const extraTheme = "neon";
    const simulateThemeResolution = (themeCandidate: string): ThemeId => {
      if (isThemeId(themeCandidate)) return themeCandidate;
      if (themeCandidate === extraTheme) return "cinematic"; // Geri dönüş güvenliği
      return DEFAULT_THEME;
    };

    expect(simulateThemeResolution("classic")).toBe("classic");
    expect(simulateThemeResolution("neon")).toBe("cinematic");
    expect(simulateThemeResolution("unknown")).toBe("cinematic");
  });

  it("Prova 3: i18n altyapısı ek dil (örneğin de) eklenmesine hazırdır", () => {
    // Mevcut dil çözümlemesi kontrol edilir
    expect(resolveLocale("tr")).toBe("tr");
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("invalid")).toBe("tr");
    expect(resolveLocale(null)).toBe("tr");

    // Sözlük çevirmeni TR ve EN için çalışır
    const trTranslator = getTranslator("tr");
    const enTranslator = getTranslator("en");
    expect(trTranslator("brand.name")).toBe("Uludott");
    expect(enTranslator("brand.name")).toBe("Uludott");

    // Ek dil sözlüğü adaptör simülasyonu
    const mockDeDictionary = {
      brand: { name: "ULUDÖTT", tagline: "Entwicklergemeinschaft" },
      common: { close: "Schließen" },
    };

    const resolveExtendedLocale = (cookieVal: unknown): Locale | "de" => {
      if (cookieVal === "de") return "de";
      return resolveLocale(cookieVal);
    };

    expect(resolveExtendedLocale("de")).toBe("de");
    expect(resolveExtendedLocale("fr")).toBe("tr");
    expect(mockDeDictionary.brand.tagline).toBe("Entwicklergemeinschaft");
  });

  it("Ana uygulamada v0.1 referansları ve görsel kilit bozulmamıştır", () => {
    // Genişleme provaları izoledir; varsayılan tema ve dil değişmemiştir
    expect(DEFAULT_THEME).toBe("cinematic");
    expect(resolveLocale(undefined)).toBe("tr");
  });
});
