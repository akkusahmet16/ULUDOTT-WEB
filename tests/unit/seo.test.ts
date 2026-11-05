import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config.ts";
import robots from "../../src/app/robots.ts";
import {
  getDynamicIndexableRoutes,
  getNavbarRoutes,
  getRoute,
  getStaticIndexableRoutes,
  isLegacyUnimplementedPath,
  isNonIndexablePath,
  LEGACY_UNIMPLEMENTED_ROUTES,
  NEXT_CONFIG_PRIVATE_HEADER_SOURCES,
  NON_INDEXABLE_PREFIXES,
  PRIVATE_API_PREFIXES,
  resolveCanonicalPath,
  ROUTES,
} from "../../src/config/routes.config.ts";
import { LOCALE_URL_POLICY } from "../../src/i18n/config.ts";
import { routeClass } from "../../src/lib/security/headers.ts";
import {
  buildMetadata,
  formatDocumentTitle,
  normalizeBrandlessTitle,
} from "../../src/seo/build-metadata.ts";

describe("Faz 2 / İş 2A & 2B — Rota görünürlük, indeksleme, kanonik SEO ve buildMetadata", () => {
  it("menü görünürlüğü, URL varlığı ve indekslenebilirliği birbirinden ayrı alanlar olarak korur", () => {
    const navbarIds = getNavbarRoutes().map((r) => r.id);
    expect(navbarIds).toEqual([
      "home",
      "about",
      "ulujam",
      "events",
      "games",
      "contact",
    ]);

    const dynamicIndexableIds = getDynamicIndexableRoutes().map((r) => r.id);
    expect(dynamicIndexableIds).toEqual(["eventDetail", "gameDetail"]);
    for (const id of dynamicIndexableIds) {
      const route = getRoute(id);
      expect(route.indexable).toBe(true);
      expect(route.visibility).toBe("public-unlisted");
    }

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
      expect(
        resolveCanonicalPath(id, { params: { formSlug: "f", token: "t" } }),
      ).toBeNull();
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
      expect(
        getStaticIndexableRoutes().some((r) => r.path === legacy.path),
      ).toBe(false);
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

    expect(resolveCanonicalPath("games")).toBe("/oyunlar");
    expect(
      resolveCanonicalPath("games", {
        searchParams: { cursor: "eyJpZCI6IjEyMyJ9" },
      }),
    ).toBe("/oyunlar");

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

  it("NON_INDEXABLE_PREFIXES politikasının robots.ts, security/headers.ts ve next.config.ts ile tam uyumlu ve client-safe olduğunu doğrular", async () => {
    const routesConfigSource = fs.readFileSync(
      path.join(process.cwd(), "src/config/routes.config.ts"),
      "utf8",
    );
    expect(routesConfigSource).not.toMatch(
      /from\s+["'][^"']*(?:lib\/auth|lib\/db|lib\/config\/server|next\/headers)/,
    );

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

    const configuredHeaders = (await nextConfig.headers?.()) ?? [];
    expect(configuredHeaders.map((h) => h.source)).toEqual([
      ...NEXT_CONFIG_PRIVATE_HEADER_SOURCES,
    ]);

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

    for (const publicRoute of getStaticIndexableRoutes()) {
      expect(isNonIndexablePath(publicRoute.path)).toBe(false);
      expect(routeClass(publicRoute.path)).toBe("public");
    }
  });

  it("buildMetadata DB'ye erişmeden başlık şablonunu tek markayla üretir ve '— Uludott | ULUDOTT' tekrarını kaldırır", () => {
    const buildMetadataSource = fs.readFileSync(
      path.join(process.cwd(), "src/seo/build-metadata.ts"),
      "utf8",
    );
    expect(buildMetadataSource).not.toMatch(
      /from\s+["'][^"']*(?:lib\/database|lib\/auth|lib\/config\/server|modules\/)/,
    );

    expect(normalizeBrandlessTitle("Hakkımızda — Uludott")).toBe("Hakkımızda");
    expect(normalizeBrandlessTitle("UluJam — Uludott | ULUDOTT")).toBe(
      "UluJam",
    );
    expect(
      normalizeBrandlessTitle(
        "Uludott — Dijital Oyun Tasarım Topluluğu | ULUDOTT",
      ),
    ).toBe("Dijital Oyun Tasarım Topluluğu");
    expect(formatDocumentTitle("Hakkımızda — Uludott")).toBe(
      "Hakkımızda | ULUDOTT",
    );

    const aboutTr = buildMetadata({ routeId: "about", locale: "tr" });
    expect(aboutTr.title).toBe("Hakkımızda");
    expect(formatDocumentTitle(String(aboutTr.title))).toBe(
      "Hakkımızda | ULUDOTT",
    );
    expect(formatDocumentTitle(String(aboutTr.title))).not.toContain(
      "— Uludott | ULUDOTT",
    );
    expect(aboutTr.alternates?.canonical).toBe("/hakkimizda");
    expect(aboutTr.alternates?.languages).toBeUndefined();

    const aboutEn = buildMetadata({ routeId: "about", locale: "en" });
    expect(aboutEn.title).toBe("About");
    expect(aboutEn.alternates?.canonical).toBe("/hakkimizda");

    const gamesWithCursor = buildMetadata({
      routeId: "games",
      searchParams: { cursor: "page-2-token" },
    });
    expect(gamesWithCursor.title).toBe("Oyunlar");
    expect(gamesWithCursor.alternates?.canonical).toBe("/oyunlar");
  });

  it("buildMetadata dinamik detay, 404/hatalı slug ve özel/noindex rotalarında token ve query sızıntısını engeller", () => {
    const eventMeta = buildMetadata({
      routeId: "eventDetail",
      params: { slug: "coffee-talk" },
      searchParams: { token: "secret", utm: "1" },
      content: {
        title: "Coffee Talk — Uludott",
        description: "Sektör buluşması",
        baseUrl: "https://uludott.test",
        includeSocialCards: true,
        image: {
          id: "img-123",
          altText: "Coffee Talk afişi",
          width: 1080,
          height: 1350,
        },
      },
    });
    expect(eventMeta.title).toBe("Coffee Talk");
    expect(eventMeta.alternates?.canonical).toBe(
      "https://uludott.test/etkinlikler/coffee-talk",
    );
    expect(eventMeta.openGraph?.url).toBe(
      "https://uludott.test/etkinlikler/coffee-talk",
    );

    // 404 / bulunamayan slug noindex olur ve canonical üretmez
    const missingGameMeta = buildMetadata({
      routeId: "gameDetail",
      params: { slug: "olmayan-oyun" },
      content: { notFound: true },
    });
    expect(missingGameMeta.title).toBe("Oyun bulunamadı");
    expect(missingGameMeta.robots).toEqual({ index: false, follow: false });
    expect(missingGameMeta.alternates).toBeUndefined();

    // Hatalı/traversal slug noindex olur
    const invalidSlugMeta = buildMetadata({
      routeId: "eventDetail",
      params: { slug: "../admin" },
    });
    expect(invalidSlugMeta.robots).toEqual({ index: false, follow: false });
    expect(invalidSlugMeta.alternates).toBeUndefined();

    // Özel token rotaları noindex + no-referrer olur ve token'ı canonical/openGraph'a sızdırmaz
    for (const privateId of [
      "privateCard",
      "privateTeam",
      "privateConsent",
    ] as const) {
      const meta = buildMetadata({
        routeId: privateId,
        params: { token: "cap_secret_token_999" },
      });
      expect(meta.robots).toEqual({ index: false, follow: false });
      expect(meta.referrer).toBe("no-referrer");
      expect(meta.alternates).toBeUndefined();
      expect(meta.openGraph).toBeUndefined();
      expect(JSON.stringify(meta)).not.toContain("cap_secret_token_999");
    }
  });
});
