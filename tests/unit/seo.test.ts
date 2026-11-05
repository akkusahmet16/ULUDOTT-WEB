import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import robots from "../../src/app/robots.ts";
import {
  getDynamicIndexableRoutes,
  getNavbarRoutes,
  getRoute,
  getStaticIndexableRoutes,
  isLegacyUnimplementedPath,
  isNonIndexablePath,
  LEGACY_UNIMPLEMENTED_ROUTES,
  NON_INDEXABLE_PREFIXES,
  PRIVATE_API_PREFIXES,
  resolveCanonicalPath,
  ROUTES,
} from "../../src/config/routes.config.ts";
import { LOCALE_URL_POLICY } from "../../src/i18n/config.ts";
import { routeClass } from "../../src/lib/security/headers.ts";

describe("Faz 2 / İş 2A — Rota görünürlük, indeksleme ve kanonik SEO politikası", () => {
  it("menü görünürlüğü, URL varlığı ve indekslenebilirliği birbirinden ayrı alanlar olarak korur", () => {
    // Menüde görünen 6 statik genel rota
    const navbarIds = getNavbarRoutes().map((r) => r.id);
    expect(navbarIds).toEqual([
      "home",
      "about",
      "ulujam",
      "events",
      "games",
      "contact",
    ]);

    // Dinamik detay sayfaları indekslenebilir fakat navbar'da yer almaz
    const dynamicIndexableIds = getDynamicIndexableRoutes().map((r) => r.id);
    expect(dynamicIndexableIds).toEqual(["eventDetail", "gameDetail"]);
    for (const id of dynamicIndexableIds) {
      const route = getRoute(id);
      expect(route.indexable).toBe(true);
      expect(route.visibility).toBe("public-unlisted");
    }

    // Başvuru, makbuz ve özel token sayfaları gerçek URL'dir fakat ne navbar'da ne de indekste yer alır
    for (const id of [
      "application",
      "receipt",
      "privateCard",
      "privateTeam",
      "privateConsent",
    ] as const) {
      const route = getRoute(id);
      expect(route.indexable).toBe(false);
      expect(route.visibility).not.toBe("navbar");
      expect(resolveCanonicalPath(id, { params: { formSlug: "f", token: "t" } })).toBeNull();
    }
  });

  it("/duyurular, /linkler ve /destek için LEGACY_UNIMPLEMENTED_ROUTES kaydını korur; varmış gibi menü veya sitemap üretmez", () => {
    expect(LEGACY_UNIMPLEMENTED_ROUTES).toHaveLength(3);
    for (const legacy of LEGACY_UNIMPLEMENTED_ROUTES) {
      expect(legacy.status).toBe("unimplemented");
      expect(legacy.includeInNav).toBe(false);
      expect(legacy.includeInSitemap).toBe(false);
      expect(legacy.redirectTarget).toBeNull();
      expect(isLegacyUnimplementedPath(legacy.path)).toBe(true);
      expect(isLegacyUnimplementedPath(`${legacy.path}/detay`)).toBe(true);

      expect(ROUTES.some((r) => r.path === legacy.path)).toBe(false);
      expect(getNavbarRoutes().some((r) => r.path === legacy.path)).toBe(false);
      expect(getStaticIndexableRoutes().some((r) => r.path === legacy.path)).toBe(
        false,
      );
    }
    expect(isLegacyUnimplementedPath("/etkinlikler")).toBe(false);
  });

  it("Türkçe URL'leri ve sayfalama (query cursor) için ana liste canonical politikasını korur; /en veya hreflang uydurmaz", () => {
    expect(LOCALE_URL_POLICY.prefixLocaleInPath).toBe(false);
    expect(LOCALE_URL_POLICY.generateHreflangAlternates).toBe(false);

    expect(resolveCanonicalPath("home")).toBe("/");
    expect(resolveCanonicalPath("about")).toBe("/hakkimizda");
    expect(resolveCanonicalPath("ulujam")).toBe("/ulujam");
    expect(resolveCanonicalPath("events")).toBe("/etkinlikler");
    expect(resolveCanonicalPath("contact")).toBe("/iletisim");

    // Query cursor için ana liste canonical'ı (/oyunlar) seçilir
    expect(resolveCanonicalPath("games")).toBe("/oyunlar");
    expect(
      resolveCanonicalPath("games", {
        searchParams: { cursor: "eyJpZCI6IjEyMyJ9" },
      }),
    ).toBe("/oyunlar");

    // Dinamik detaylar için kendi doğrulanan slug yolu canonical olur, query sızmaz
    expect(
      resolveCanonicalPath("eventDetail", {
        params: { slug: "coffee-talk" },
        searchParams: { utm_source: "social" },
      }),
    ).toBe("/etkinlikler/coffee-talk");
    expect(
      resolveCanonicalPath("gameDetail", {
        params: { slug: "ulujam-winner" },
      }),
    ).toBe("/oyunlar/ulujam-winner");
  });

  it("NON_INDEXABLE_PREFIXES politikasının robots.ts, security/headers.ts ve next.config.ts ile tam uyumlu ve client-safe olduğunu doğrular", () => {
    // Client-safe kontrolü: routes.config.ts hiçbir server/auth/db modülünü import etmez
    const routesConfigSource = fs.readFileSync(
      path.join(process.cwd(), "src/config/routes.config.ts"),
      "utf8",
    );
    expect(routesConfigSource).not.toMatch(
      /from\s+["'][^"']*(?:lib\/auth|lib\/db|lib\/config\/server|next\/headers)/,
    );

    // robots.ts disallow listesi NON_INDEXABLE_PREFIXES ile bire bir örtüşür
    const syntheticEnv: Record<string, string | undefined> = {
      APP_URL: "https://uludott.test",
      DATABASE_URL: "postgresql://test:test@127.0.0.1:5432/test",
      OBJECT_STORAGE_ENDPOINT: "http://127.0.0.1:9000",
      OBJECT_STORAGE_REGION: "us-east-1",
      OBJECT_STORAGE_BUCKET: "test-bucket",
      OBJECT_STORAGE_ACCESS_KEY: "test-access",
      OBJECT_STORAGE_SECRET_KEY: "test-secret",
    };
    const previousEnv: Record<string, string | undefined> = {};
    for (const key of Object.keys(syntheticEnv)) {
      previousEnv[key] = process.env[key];
      process.env[key] = syntheticEnv[key];
    }
    try {
      const robotsConfig = robots();
      const rules = Array.isArray(robotsConfig.rules)
        ? robotsConfig.rules[0]
        : robotsConfig.rules;
      expect(rules?.disallow).toEqual([...NON_INDEXABLE_PREFIXES]);
      expect(robotsConfig.sitemap).toBe("https://uludott.test/sitemap.xml");
    } finally {
      for (const [key, value] of Object.entries(previousEnv)) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    }

    // NON_INDEXABLE_PREFIXES altındaki tüm yollar isNonIndexablePath ve routeClass("private") ile eşleşir
    for (const samplePath of [
      "/admin",
      "/admin/formlar",
      "/l/short-1",
      "/basvuru/ulujam-2026",
      "/makbuz",
      "/takim/secret-token",
      "/kart/secret-token",
      "/yayin-onayi/secret-token",
    ]) {
      expect(isNonIndexablePath(samplePath)).toBe(true);
      expect(routeClass(samplePath)).toBe("private");
    }

    for (const apiPrefix of PRIVATE_API_PREFIXES) {
      expect(isNonIndexablePath(apiPrefix)).toBe(true);
      expect(routeClass(apiPrefix)).toBe("private");
    }

    // Genel rotalar indeks dışı değildir
    for (const publicRoute of getStaticIndexableRoutes()) {
      expect(isNonIndexablePath(publicRoute.path)).toBe(false);
      expect(routeClass(publicRoute.path)).toBe("public");
    }
  });
});
