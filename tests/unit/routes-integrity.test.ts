import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ADMIN_PAGE_PATTERNS,
  buildRoute,
  getDynamicIndexableRoutes,
  getNavbarRoutes,
  getRoute,
  getStaticIndexableRoutes,
  LEGACY_UNIMPLEMENTED_ROUTES,
  NON_PAGE_HANDLER_PATTERNS,
  ROUTES,
  type RouteDefinition,
  type RouteId,
} from "../../src/config/routes.config.ts";
import { isDictionaryKey } from "../../src/i18n/keys.ts";
import { getTranslator } from "../../src/i18n/translate.ts";

const ROOT_DIR = process.cwd();
const APP_DIR = path.join(ROOT_DIR, "src/app");

interface DiscoveredAppRoutes {
  readonly publicStaticPages: string[];
  readonly publicDynamicPages: string[];
  readonly privatePages: string[];
  readonly adminPages: string[];
  readonly apiRoutes: string[];
  readonly nonPageHandlers: string[];
}

function normalizeUrlPatternFromAppFile(relativeFile: string): string {
  const dir = path.posix.dirname(relativeFile);
  if (dir === ".") return "/";
  const segments = dir
    .split("/")
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")));
  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

function scanAppFilesystem(appDir: string): DiscoveredAppRoutes {
  const publicStaticPages: string[] = [];
  const publicDynamicPages: string[] = [];
  const privatePages: string[] = [];
  const adminPages: string[] = [];
  const apiRoutes: string[] = [];
  const nonPageHandlers: string[] = [];

  const PRIVATE_PAGE_PREFIXES = new Set([
    "/basvuru",
    "/makbuz",
    "/kart",
    "/takim",
    "/yayin-onayi",
  ]);

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (entry.name !== "page.tsx" && entry.name !== "route.ts") continue;

      const relativeFile = path
        .relative(appDir, fullPath)
        .split(path.sep)
        .join("/");
      const urlPattern = normalizeUrlPatternFromAppFile(relativeFile);

      if (entry.name === "route.ts") {
        if (urlPattern === "/api" || urlPattern.startsWith("/api/")) {
          apiRoutes.push(urlPattern);
        } else {
          nonPageHandlers.push(urlPattern);
        }
        continue;
      }

      // page.tsx sınıflandırması
      if (urlPattern === "/admin" || urlPattern.startsWith("/admin/")) {
        adminPages.push(urlPattern);
        continue;
      }

      const firstSegment =
        urlPattern === "/" ? "/" : `/${urlPattern.split("/")[1]}`;
      if (
        relativeFile.startsWith("(private)/") ||
        PRIVATE_PAGE_PREFIXES.has(firstSegment)
      ) {
        privatePages.push(urlPattern);
        continue;
      }

      if (urlPattern.includes("[")) {
        publicDynamicPages.push(urlPattern);
      } else {
        publicStaticPages.push(urlPattern);
      }
    }
  }

  walk(appDir);

  return {
    publicStaticPages: publicStaticPages.sort(),
    publicDynamicPages: publicDynamicPages.sort(),
    privatePages: privatePages.sort(),
    adminPages: adminPages.sort(),
    apiRoutes: apiRoutes.sort(),
    nonPageHandlers: nonPageHandlers.sort(),
  };
}

function resolvePageFileForRoutePath(routePath: string): string | null {
  const candidates =
    routePath === "/"
      ? [path.join(APP_DIR, "page.tsx")]
      : [
          path.join(APP_DIR, routePath.slice(1), "page.tsx"),
          path.join(APP_DIR, "(public)", routePath.slice(1), "page.tsx"),
          path.join(APP_DIR, "(private)", routePath.slice(1), "page.tsx"),
        ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function collectDomIdsFromPageAndLocalImports(pageFilePath: string): Set<string> {
  const visitedFiles = new Set<string>();
  const domIds = new Set<string>();

  function inspectFile(filePath: string): void {
    if (visitedFiles.has(filePath) || !fs.existsSync(filePath)) return;
    visitedFiles.add(filePath);
    const source = fs.readFileSync(filePath, "utf8");

    for (const match of source.matchAll(/\bid\s*=\s*"([^"]+)"/g)) {
      if (match[1]) domIds.add(match[1]);
    }
    for (const match of source.matchAll(/\bid\s*=\s*\{`([^`]+)`\}/g)) {
      if (match[1]) domIds.add(match[1]);
    }

    const importPattern = /from\s+["'](\.[^"']+)["']/g;
    for (const match of source.matchAll(importPattern)) {
      const importSpec = match[1];
      if (!importSpec) continue;
      const baseResolved = path.resolve(path.dirname(filePath), importSpec);
      const possibleFiles = [
        baseResolved,
        `${baseResolved}.tsx`,
        `${baseResolved}.ts`,
        path.join(baseResolved, "index.tsx"),
        path.join(baseResolved, "index.ts"),
      ];
      for (const candidate of possibleFiles) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          inspectFile(candidate);
          break;
        }
      }
    }
  }

  inspectFile(pageFilePath);
  return domIds;
}

function validateRouteIntegritySnapshot(options: {
  routes: readonly RouteDefinition[];
  discovered: DiscoveredAppRoutes;
  domIdLookup: (routePath: string) => Set<string> | null;
}): string[] {
  const errors: string[] = [];

  const configStaticPublic = options.routes
    .filter((r) => r.kind === "public-static")
    .map((r) => r.pattern)
    .sort();
  const configDynamicPublic = options.routes
    .filter((r) => r.kind === "public-dynamic")
    .map((r) => r.pattern)
    .sort();
  const configPrivate = options.routes
    .filter((r) => r.kind === "private-page")
    .map((r) => r.pattern)
    .sort();

  for (const pattern of configStaticPublic) {
    if (!options.discovered.publicStaticPages.includes(pattern)) {
      errors.push(`Missing filesystem page for static route: ${pattern}`);
    }
  }
  for (const pattern of options.discovered.publicStaticPages) {
    if (!configStaticPublic.includes(pattern as `/${string}`)) {
      errors.push(`Unregistered static public page in filesystem: ${pattern}`);
    }
  }

  for (const pattern of configDynamicPublic) {
    if (!options.discovered.publicDynamicPages.includes(pattern)) {
      errors.push(`Missing filesystem page for dynamic route: ${pattern}`);
    }
  }
  for (const pattern of options.discovered.publicDynamicPages) {
    if (!configDynamicPublic.includes(pattern as `/${string}`)) {
      errors.push(`Unregistered dynamic public page in filesystem: ${pattern}`);
    }
  }

  for (const pattern of configPrivate) {
    if (!options.discovered.privatePages.includes(pattern)) {
      errors.push(`Missing filesystem page for private route: ${pattern}`);
    }
  }
  for (const pattern of options.discovered.privatePages) {
    if (!configPrivate.includes(pattern as `/${string}`)) {
      errors.push(`Unregistered private page in filesystem: ${pattern}`);
    }
  }

  for (const route of options.routes) {
    for (const child of route.children ?? []) {
      const [targetPath, fragment] = child.href.split("#");
      if (!targetPath || !fragment || fragment !== child.fragment) {
        errors.push(`Malformed child anchor href "${child.href}" in route "${route.id}"`);
        continue;
      }
      const domIds = options.domIdLookup(targetPath);
      if (!domIds) {
        errors.push(`Anchor target page "${targetPath}" does not exist`);
        continue;
      }
      if (!domIds.has(fragment)) {
        errors.push(
          `Missing DOM id="#${fragment}" on page "${targetPath}" for route "${route.id}"`,
        );
      }
    }
  }

  return errors;
}

describe("Faz 2 / İş 2A — Typed route sözleşmesi ve dosya sistemi bütünlüğü", () => {
  it("src/app dosya sistemini route-group ve dinamik segmentleri çözerek tarar; 6 genel sayfa, 2 dinamik detay, özel/admin/API sınıflarını doğrular", () => {
    const discovered = scanAppFilesystem(APP_DIR);

    // 8 genel statik sayfa
    expect(discovered.publicStaticPages).toEqual([
      "/",
      "/etkinlikler",
      "/fanzin",
      "/hakkimizda",
      "/iletisim",
      "/oyunlar",
      "/ulujam",
      "/uye-karti",
    ]);
    expect(getStaticIndexableRoutes().map((r) => r.path).sort()).toEqual(
      discovered.publicStaticPages,
    );

    // 2 dinamik detay sayfası
    expect(discovered.publicDynamicPages).toEqual([
      "/etkinlikler/[slug]",
      "/oyunlar/[slug]",
    ]);
    expect(getDynamicIndexableRoutes().map((r) => r.pattern).sort()).toEqual(
      discovered.publicDynamicPages,
    );

    // 5 özel/operasyonel sayfa
    expect(discovered.privatePages).toEqual([
      "/basvuru/[formSlug]",
      "/kart/[token]",
      "/makbuz",
      "/takim/[token]",
      "/yayin-onayi/[token]",
    ]);

    // 20 admin sayfası
    expect(discovered.adminPages).toEqual([...ADMIN_PAGE_PATTERNS].sort());

    // Özel route.ts işleyicileri ve API'ler (menü kaydı olmaya zorlanmaz)
    expect(discovered.nonPageHandlers).toEqual(
      [...NON_PAGE_HANDLER_PATTERNS].sort(),
    );
    expect(discovered.apiRoutes.length).toBeGreaterThanOrEqual(25);
    for (const apiRoute of discovered.apiRoutes) {
      expect(ROUTES.some((r) => r.path === apiRoute)).toBe(false);
    }

    const integrityErrors = validateRouteIntegritySnapshot({
      routes: ROUTES,
      discovered,
      domIdLookup: (routePath) => {
        const pageFile = resolvePageFileForRoutePath(routePath);
        return pageFile ? collectDomIdsFromPageAndLocalImports(pageFile) : null;
      },
    });
    expect(integrityErrors).toEqual([]);
  });

  it("alt menü fragment'lerinin ve sayfa içi keşfet bağlantısının gerçek DOM id karşılığını doğrular", () => {
    const navbarRoutes = getNavbarRoutes();
    expect(navbarRoutes.map((r) => r.path)).toEqual([
      "/",
      "/hakkimizda",
      "/ulujam",
      "/etkinlikler",
      "/oyunlar",
      "/fanzin",
      "/iletisim",
    ]);

    // Navbar sıralaması benzersiz ve artan olmalıdır
    const orders = navbarRoutes.map((r) => r.order);
    expect(orders).toEqual([0, 1, 2, 3, 4, 5, 6]);

    for (const route of ROUTES) {
      const pageFile = resolvePageFileForRoutePath(route.pattern);
      expect(
        pageFile,
        `Page file must exist for route "${route.id}" (${route.pattern})`,
      ).not.toBeNull();

      for (const child of route.children ?? []) {
        const [targetPath, fragment] = child.href.split("#");
        expect(targetPath).toBe(route.path);
        expect(fragment).toBe(child.fragment);
        const targetPageFile = resolvePageFileForRoutePath(targetPath!);
        expect(targetPageFile).not.toBeNull();
        const domIds = collectDomIdsFromPageAndLocalImports(targetPageFile!);
        expect(
          domIds.has(child.fragment),
          `Expected DOM id="${child.fragment}" to exist in ${targetPath}`,
        ).toBe(true);
      }
    }

    // Ana sayfadaki #kesfet bağlantısının StoryPanels içindeki id="kesfet" karşılığı
    const homePageFile = resolvePageFileForRoutePath("/");
    expect(homePageFile).not.toBeNull();
    const homeIds = collectDomIdsFromPageAndLocalImports(homePageFile!);
    expect(homeIds.has("kesfet")).toBe(true);
  });

  it("sahte rotayı ve eksik DOM anchor'ını kırmızıya düşürür (negatif koruma testi)", () => {
    const discovered = scanAppFilesystem(APP_DIR);
    const realLookup = (routePath: string) => {
      const pageFile = resolvePageFileForRoutePath(routePath);
      return pageFile ? collectDomIdsFromPageAndLocalImports(pageFile) : null;
    };

    const fakeRoute: RouteDefinition = {
      id: "home",
      kind: "public-static",
      path: "/olmayan-sahte-rota",
      pattern: "/olmayan-sahte-rota",
      paramNames: [],
      labelKey: "nav.home",
      visibility: "navbar",
      order: 99,
      indexable: true,
      canonical: { strategy: "self", basePath: "/olmayan-sahte-rota" },
      metadataKey: {
        titleKey: "meta.home.title",
        descriptionKey: "meta.home.description",
      },
    };

    const fakeRouteErrors = validateRouteIntegritySnapshot({
      routes: [...ROUTES, fakeRoute],
      discovered,
      domIdLookup: realLookup,
    });
    expect(fakeRouteErrors).toContain(
      "Missing filesystem page for static route: /olmayan-sahte-rota",
    );

    const brokenAnchorRoute: RouteDefinition = {
      ...getRoute("about"),
      children: [
        {
          id: "broken-anchor",
          href: "/hakkimizda#olmayan-bolum-id",
          fragment: "olmayan-bolum-id",
          labelKey: "nav.aboutBoard",
        },
      ],
    };

    const brokenAnchorErrors = validateRouteIntegritySnapshot({
      routes: ROUTES.map((r) => (r.id === "about" ? brokenAnchorRoute : r)),
      discovered,
      domIdLookup: realLookup,
    });
    expect(brokenAnchorErrors).toContain(
      'Missing DOM id="#olmayan-bolum-id" on page "/hakkimizda" for route "about"',
    );
  });

  it("tüm rota etiket ve metadata anahtarlarının TR/EN sözlükte karşılığı olduğunu ve footer sosyal bağlantılarının panel kaynağında kaldığını doğrular", () => {
    const tTr = getTranslator("tr");
    const tEn = getTranslator("en");

    for (const route of ROUTES) {
      expect(isDictionaryKey(route.labelKey)).toBe(true);
      expect(isDictionaryKey(route.metadataKey.titleKey)).toBe(true);
      expect(isDictionaryKey(route.metadataKey.descriptionKey)).toBe(true);
      if (route.metadataKey.notFoundTitleKey) {
        expect(isDictionaryKey(route.metadataKey.notFoundTitleKey)).toBe(true);
      }
      if (route.submenuAriaKey) {
        expect(isDictionaryKey(route.submenuAriaKey)).toBe(true);
      }
      expect(tTr(route.labelKey).length).toBeGreaterThan(0);
      expect(tEn(route.labelKey).length).toBeGreaterThan(0);

      for (const child of route.children ?? []) {
        expect(isDictionaryKey(child.labelKey)).toBe(true);
        expect(tTr(child.labelKey).length).toBeGreaterThan(0);
        expect(tEn(child.labelKey).length).toBeGreaterThan(0);
      }
    }

    // Footer sosyal URL'leri routes.config.ts'e taşınmaz; mevcut panel ayarları kaynağında (readContactSettings) kalır.
    const footerSource = fs.readFileSync(
      path.join(ROOT_DIR, "src/components/layout/footer.tsx"),
      "utf8",
    );
    expect(footerSource).toContain("readContactSettings");
  });

  it("buildRoute(routeId, params) parametreleri doğrular/encode eder ve statik config'de gerçek token tutmaz", () => {
    expect(buildRoute("home")).toBe("/");
    expect(buildRoute("about")).toBe("/hakkimizda");
    expect(buildRoute("events")).toBe("/etkinlikler");
    expect(buildRoute("games")).toBe("/oyunlar");
    expect(buildRoute("receipt")).toBe("/makbuz");

    expect(buildRoute("eventDetail", { slug: "coffee-talk-2026" })).toBe(
      "/etkinlikler/coffee-talk-2026",
    );
    expect(buildRoute("gameDetail", { slug: "kayıp-dünya 1" })).toBe(
      `/oyunlar/${encodeURIComponent("kayıp-dünya 1")}`,
    );
    expect(buildRoute("application", { formSlug: "ulujam-2026" })).toBe(
      "/basvuru/ulujam-2026",
    );
    expect(buildRoute("privateCard", { token: "tok_abc123" })).toBe(
      "/kart/tok_abc123",
    );

    // Eksik, boş, path traversal veya geçersiz parametreler reddedilir
    expect(() =>
      buildRoute("eventDetail", {} as { slug: string }),
    ).toThrow(/Missing required route parameter "slug"/);
    expect(() => buildRoute("eventDetail", { slug: "   " })).toThrow(
      /cannot be empty/,
    );
    expect(() => buildRoute("eventDetail", { slug: "../admin" })).toThrow(
      /invalid path characters/,
    );
    expect(() => buildRoute("privateCard", { token: "a/b" })).toThrow(
      /invalid path characters/,
    );
    expect(() => buildRoute("privateTeam", { token: ".." })).toThrow(
      /invalid path characters/,
    );
    expect(() =>
      buildRoute("home" as RouteId, { unexpected: "1" }),
    ).toThrow(/does not accept path parameters/);
    expect(() => getRoute("unknown" as RouteId)).toThrow(/Unknown routeId/);

    // Gizli token URL'leri statik config'de gerçek değerle yer almaz; yalnız [token] yer tutucusu kullanılır
    for (const route of ROUTES) {
      if (route.sensitiveParamNames && route.sensitiveParamNames.length > 0) {
        expect(route.visibility).toBe("private-token");
        expect(route.indexable).toBe(false);
        expect(route.pattern).toContain("[token]");
      }
    }
    expect(LEGACY_UNIMPLEMENTED_ROUTES.map((r) => r.path)).toEqual([
      "/duyurular",
      "/linkler",
      "/destek",
    ]);
  });
});
