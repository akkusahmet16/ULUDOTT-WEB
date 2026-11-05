import type { DictionaryKey } from "../i18n/keys.ts";

export const ROUTE_IDS = [
  "home",
  "about",
  "ulujam",
  "events",
  "games",
  "contact",
  "eventDetail",
  "gameDetail",
  "application",
  "receipt",
  "privateCard",
  "privateTeam",
  "privateConsent",
] as const;

export type RouteId = (typeof ROUTE_IDS)[number];

export type StaticRouteId =
  | "home"
  | "about"
  | "ulujam"
  | "events"
  | "games"
  | "contact"
  | "receipt";

export type ParameterizedRouteId = Exclude<RouteId, StaticRouteId>;

export interface RouteParamsMap {
  readonly home: undefined;
  readonly about: undefined;
  readonly ulujam: undefined;
  readonly events: undefined;
  readonly games: undefined;
  readonly contact: undefined;
  readonly eventDetail: { readonly slug: string };
  readonly gameDetail: { readonly slug: string };
  readonly application: { readonly formSlug: string };
  readonly receipt: undefined;
  readonly privateCard: { readonly token: string };
  readonly privateTeam: { readonly token: string };
  readonly privateConsent: { readonly token: string };
}

export type RouteKind = "public-static" | "public-dynamic" | "private-page";

export type RouteVisibility = "navbar" | "public-unlisted" | "private-token";

export type CanonicalStrategy = "self" | "list-root" | "dynamic-slug" | "none";

export interface RouteCanonicalPolicy {
  readonly strategy: CanonicalStrategy;
  readonly basePath: string;
}

export interface RouteMetadataKeys {
  readonly titleKey: DictionaryKey;
  readonly descriptionKey: DictionaryKey;
  readonly notFoundTitleKey?: DictionaryKey;
}

export interface RouteChildAnchor {
  readonly id: string;
  readonly href: `/${string}#${string}`;
  readonly fragment: string;
  readonly labelKey: DictionaryKey;
}

export interface RouteDefinition {
  readonly id: RouteId;
  readonly kind: RouteKind;
  readonly path: `/${string}`;
  readonly pattern: `/${string}`;
  readonly paramNames: readonly string[];
  readonly sensitiveParamNames?: readonly string[];
  readonly labelKey: DictionaryKey;
  readonly visibility: RouteVisibility;
  readonly order?: number;
  readonly indexable: boolean;
  readonly canonical: RouteCanonicalPolicy;
  readonly metadataKey: RouteMetadataKeys;
  readonly previewImage?: string;
  readonly submenuAriaKey?: DictionaryKey;
  readonly children?: readonly RouteChildAnchor[];
}

export const DEFAULT_MENU_PREVIEW_IMAGE =
  "/community/00-ortak/menu-topluluk.webp" as const;

export const PEOPLE_MENU_PREVIEW_IMAGE =
  "/community/00-ortak/menu-people.webp" as const;

export const ROUTES: readonly RouteDefinition[] = [
  {
    id: "home",
    kind: "public-static",
    path: "/",
    pattern: "/",
    paramNames: [],
    labelKey: "nav.home",
    visibility: "navbar",
    order: 0,
    indexable: true,
    canonical: { strategy: "self", basePath: "/" },
    metadataKey: {
      titleKey: "meta.home.title",
      descriptionKey: "meta.home.description",
    },
    previewImage: DEFAULT_MENU_PREVIEW_IMAGE,
  },
  {
    id: "about",
    kind: "public-static",
    path: "/hakkimizda",
    pattern: "/hakkimizda",
    paramNames: [],
    labelKey: "nav.about",
    visibility: "navbar",
    order: 1,
    indexable: true,
    canonical: { strategy: "self", basePath: "/hakkimizda" },
    metadataKey: {
      titleKey: "meta.about.title",
      descriptionKey: "meta.about.description",
    },
    previewImage: PEOPLE_MENU_PREVIEW_IMAGE,
    submenuAriaKey: "nav.aboutSubmenuAria",
    children: [
      {
        id: "about-board",
        href: "/hakkimizda#yonetim-kurulu",
        fragment: "yonetim-kurulu",
        labelKey: "nav.aboutBoard",
      },
      {
        id: "about-places",
        href: "/hakkimizda#mekanlar",
        fragment: "mekanlar",
        labelKey: "nav.aboutPlaces",
      },
    ],
  },
  {
    id: "ulujam",
    kind: "public-static",
    path: "/ulujam",
    pattern: "/ulujam",
    paramNames: [],
    labelKey: "nav.ulujam",
    visibility: "navbar",
    order: 2,
    indexable: true,
    canonical: { strategy: "self", basePath: "/ulujam" },
    metadataKey: {
      titleKey: "meta.ulujam.title",
      descriptionKey: "meta.ulujam.description",
    },
    previewImage: DEFAULT_MENU_PREVIEW_IMAGE,
  },
  {
    id: "events",
    kind: "public-static",
    path: "/etkinlikler",
    pattern: "/etkinlikler",
    paramNames: [],
    labelKey: "nav.events",
    visibility: "navbar",
    order: 3,
    indexable: true,
    canonical: { strategy: "self", basePath: "/etkinlikler" },
    metadataKey: {
      titleKey: "meta.events.title",
      descriptionKey: "meta.events.description",
    },
    previewImage: DEFAULT_MENU_PREVIEW_IMAGE,
  },
  {
    id: "games",
    kind: "public-static",
    path: "/oyunlar",
    pattern: "/oyunlar",
    paramNames: [],
    labelKey: "nav.games",
    visibility: "navbar",
    order: 4,
    indexable: true,
    canonical: { strategy: "list-root", basePath: "/oyunlar" },
    metadataKey: {
      titleKey: "meta.games.title",
      descriptionKey: "meta.games.description",
    },
    previewImage: DEFAULT_MENU_PREVIEW_IMAGE,
    submenuAriaKey: "nav.gamesSubmenuAria",
    children: [
      {
        id: "games-degrees",
        href: "/oyunlar#derece-oyunlari",
        fragment: "derece-oyunlari",
        labelKey: "nav.gamesDegrees",
      },
      {
        id: "games-published",
        href: "/oyunlar#yayinlanan-oyunlar",
        fragment: "yayinlanan-oyunlar",
        labelKey: "nav.gamesPublished",
      },
    ],
  },
  {
    id: "contact",
    kind: "public-static",
    path: "/iletisim",
    pattern: "/iletisim",
    paramNames: [],
    labelKey: "nav.contact",
    visibility: "navbar",
    order: 5,
    indexable: true,
    canonical: { strategy: "self", basePath: "/iletisim" },
    metadataKey: {
      titleKey: "meta.contact.title",
      descriptionKey: "meta.contact.description",
    },
    previewImage: DEFAULT_MENU_PREVIEW_IMAGE,
  },
  {
    id: "eventDetail",
    kind: "public-dynamic",
    path: "/etkinlikler/[slug]",
    pattern: "/etkinlikler/[slug]",
    paramNames: ["slug"],
    labelKey: "nav.events",
    visibility: "public-unlisted",
    indexable: true,
    canonical: { strategy: "dynamic-slug", basePath: "/etkinlikler" },
    metadataKey: {
      titleKey: "meta.eventDetail.title",
      descriptionKey: "meta.eventDetail.description",
      notFoundTitleKey: "meta.eventDetail.notFoundTitle",
    },
  },
  {
    id: "gameDetail",
    kind: "public-dynamic",
    path: "/oyunlar/[slug]",
    pattern: "/oyunlar/[slug]",
    paramNames: ["slug"],
    labelKey: "nav.games",
    visibility: "public-unlisted",
    indexable: true,
    canonical: { strategy: "dynamic-slug", basePath: "/oyunlar" },
    metadataKey: {
      titleKey: "meta.gameDetail.title",
      descriptionKey: "meta.gameDetail.description",
      notFoundTitleKey: "meta.gameDetail.notFoundTitle",
    },
  },
  {
    id: "application",
    kind: "private-page",
    path: "/basvuru/[formSlug]",
    pattern: "/basvuru/[formSlug]",
    paramNames: ["formSlug"],
    labelKey: "meta.application.title",
    visibility: "public-unlisted",
    indexable: false,
    canonical: { strategy: "none", basePath: "/basvuru" },
    metadataKey: {
      titleKey: "meta.application.title",
      descriptionKey: "meta.application.description",
    },
  },
  {
    id: "receipt",
    kind: "private-page",
    path: "/makbuz",
    pattern: "/makbuz",
    paramNames: [],
    labelKey: "meta.receipt.title",
    visibility: "private-token",
    indexable: false,
    canonical: { strategy: "none", basePath: "/makbuz" },
    metadataKey: {
      titleKey: "meta.receipt.title",
      descriptionKey: "meta.receipt.description",
    },
  },
  {
    id: "privateCard",
    kind: "private-page",
    path: "/kart/[token]",
    pattern: "/kart/[token]",
    paramNames: ["token"],
    sensitiveParamNames: ["token"],
    labelKey: "meta.privateCard.title",
    visibility: "private-token",
    indexable: false,
    canonical: { strategy: "none", basePath: "/kart" },
    metadataKey: {
      titleKey: "meta.privateCard.title",
      descriptionKey: "meta.privateCard.description",
    },
  },
  {
    id: "privateTeam",
    kind: "private-page",
    path: "/takim/[token]",
    pattern: "/takim/[token]",
    paramNames: ["token"],
    sensitiveParamNames: ["token"],
    labelKey: "meta.privateTeam.title",
    visibility: "private-token",
    indexable: false,
    canonical: { strategy: "none", basePath: "/takim" },
    metadataKey: {
      titleKey: "meta.privateTeam.title",
      descriptionKey: "meta.privateTeam.description",
    },
  },
  {
    id: "privateConsent",
    kind: "private-page",
    path: "/yayin-onayi/[token]",
    pattern: "/yayin-onayi/[token]",
    paramNames: ["token"],
    sensitiveParamNames: ["token"],
    labelKey: "meta.privateConsent.title",
    visibility: "private-token",
    indexable: false,
    canonical: { strategy: "none", basePath: "/yayin-onayi" },
    metadataKey: {
      titleKey: "meta.privateConsent.title",
      descriptionKey: "meta.privateConsent.description",
    },
  },
] as const;

export const ROUTES_BY_ID: Readonly<Record<RouteId, RouteDefinition>> =
  Object.freeze(
    Object.fromEntries(ROUTES.map((route) => [route.id, route])) as Record<
      RouteId,
      RouteDefinition
    >,
  );

/**
 * Eski mimari planda adı geçen ancak v0.1'de karşılığı bulunmayan rotalar.
 * Varmış gibi menü veya sitemap kaydı üretilmez.
 */
export interface LegacyUnimplementedRoute {
  readonly path: `/${string}`;
  readonly status: "unimplemented";
  readonly includeInNav: false;
  readonly includeInSitemap: false;
  readonly redirectTarget: null;
  readonly reason: string;
}

export const LEGACY_UNIMPLEMENTED_ROUTES: readonly LegacyUnimplementedRoute[] =
  [
    {
      path: "/duyurular",
      status: "unimplemented",
      includeInNav: false,
      includeInSitemap: false,
      redirectTarget: null,
      reason:
        "v0.1'de ayrı /duyurular sayfası bulunmuyor; varmış gibi menü veya sitemap üretilmez.",
    },
    {
      path: "/linkler",
      status: "unimplemented",
      includeInNav: false,
      includeInSitemap: false,
      redirectTarget: null,
      reason:
        "v0.1'de genel /linkler sayfası bulunmuyor; kısa bağlantılar /l/[id] üzerinden yönlendirilir.",
    },
    {
      path: "/destek",
      status: "unimplemented",
      includeInNav: false,
      includeInSitemap: false,
      redirectTarget: null,
      reason:
        "v0.1'de /destek sayfası yerine /iletisim sayfası kullanılıyor; varmış gibi menü veya sitemap üretilmez.",
    },
  ] as const;

/**
 * Client-safe arama motoru indeksleme dışı önekler.
 * `robots.ts`, `next.config.ts` ve `src/lib/security/headers.ts` ile bire bir uyumludur.
 */
export const NON_INDEXABLE_PREFIXES = [
  "/admin",
  "/api",
  "/l/",
  "/basvuru",
  "/makbuz",
  "/takim",
  "/kart",
  "/yayin-onayi",
] as const;

export const PRIVATE_API_PREFIXES = [
  "/api/admin",
  "/api/forms",
  "/api/submissions",
  "/api/ulujam",
  "/api/team",
  "/api/cards",
  "/api/wallet",
] as const;

/**
 * Yönetim paneli sayfa desenleri (menü/sitemap dışı, classic tema ve noindex).
 */
export const ADMIN_PAGE_PATTERNS = [
  "/admin",
  "/admin/basvurular",
  "/admin/basvurular/[submissionId]",
  "/admin/check-in",
  "/admin/etkinlikler",
  "/admin/formlar",
  "/admin/formlar/[formId]",
  "/admin/galeri",
  "/admin/iletisim",
  "/admin/linkler",
  "/admin/medya",
  "/admin/oyunlar",
  "/admin/oyunlar/[gameId]",
  "/admin/people",
  "/admin/sistem",
  "/admin/takim-arayanlar",
  "/admin/takim-onaylari",
  "/admin/ulujam",
  "/admin/ulujam-arsivleri",
  "/admin/ulujam-formu/[eventId]",
] as const;

/**
 * API ve özel route.ts işleyicileri (menü kaydı olmaya zorlanmaz).
 */
export const NON_PAGE_HANDLER_PATTERNS = [
  "/l/[id]",
  "/media/[variantId]",
] as const;

export function isRouteId(value: unknown): value is RouteId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(ROUTES_BY_ID, value)
  );
}

export function getRoute(routeId: RouteId): RouteDefinition {
  if (!isRouteId(routeId)) {
    throw new Error(`Unknown routeId: "${String(routeId)}"`);
  }
  return ROUTES_BY_ID[routeId];
}

export function getNavbarRoutes(): readonly RouteDefinition[] {
  return ROUTES.filter((route) => route.visibility === "navbar").sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
}

export function getStaticIndexableRoutes(): readonly RouteDefinition[] {
  return ROUTES.filter(
    (route) => route.kind === "public-static" && route.indexable,
  );
}

export function getDynamicIndexableRoutes(): readonly RouteDefinition[] {
  return ROUTES.filter(
    (route) => route.kind === "public-dynamic" && route.indexable,
  );
}

export function isLegacyUnimplementedPath(pathname: string): boolean {
  return LEGACY_UNIMPLEMENTED_ROUTES.some(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  );
}

export function isNonIndexablePath(pathname: string): boolean {
  for (const prefix of NON_INDEXABLE_PREFIXES) {
    const normalized = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
    if (pathname === normalized || pathname.startsWith(`${normalized}/`)) {
      return true;
    }
  }
  return false;
}

function validateAndEncodeParam(paramName: string, rawValue: unknown): string {
  if (typeof rawValue !== "string") {
    throw new Error(
      `Route parameter "${paramName}" must be a non-empty string`,
    );
  }
  const trimmed = rawValue.trim();
  if (trimmed.length === 0) {
    throw new Error(`Route parameter "${paramName}" cannot be empty`);
  }
  if (
    trimmed === "." ||
    trimmed === ".." ||
    trimmed.includes("/") ||
    trimmed.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(trimmed)
  ) {
    throw new Error(
      `Route parameter "${paramName}" contains invalid path characters`,
    );
  }
  return encodeURIComponent(trimmed);
}

export function buildRoute<ID extends StaticRouteId>(
  routeId: ID,
  params?: undefined,
): string;
export function buildRoute<ID extends ParameterizedRouteId>(
  routeId: ID,
  params: RouteParamsMap[ID],
): string;
export function buildRoute(
  routeId: RouteId,
  params?: Readonly<Record<string, string>>,
): string;
export function buildRoute(
  routeId: RouteId,
  params?: Readonly<Record<string, string>>,
): string {
  const route = getRoute(routeId);
  if (route.paramNames.length === 0) {
    if (params && Object.keys(params).length > 0) {
      throw new Error(
        `Static route "${routeId}" does not accept path parameters`,
      );
    }
    return route.path;
  }
  if (!params || typeof params !== "object") {
    throw new Error(
      `Route "${routeId}" requires parameters: ${route.paramNames.join(", ")}`,
    );
  }
  let resolvedPath: string = route.pattern;
  for (const paramName of route.paramNames) {
    if (!Object.prototype.hasOwnProperty.call(params, paramName)) {
      throw new Error(
        `Missing required route parameter "${paramName}" for route "${routeId}"`,
      );
    }
    const encoded = validateAndEncodeParam(paramName, params[paramName]);
    resolvedPath = resolvedPath.replace(`[${paramName}]`, encoded);
  }
  return resolvedPath;
}

/**
 * Rota için kanonik yol çözümleyicisi.
 * - İndekslenemeyen rotalar için `null` döner.
 * - `/oyunlar?cursor=...` gibi sayfalama sorgularında ana liste kanoniği (`/oyunlar`) döner.
 * - Dinamik detay rotalarında doğrulanan slug yolunu döner; sorgu/token sızdırmaz.
 */
export function resolveCanonicalPath(
  routeId: RouteId,
  options?: {
    readonly params?: Readonly<Record<string, string>>;
    readonly searchParams?: Readonly<
      Record<string, string | readonly string[] | undefined>
    >;
  },
): string | null {
  const route = getRoute(routeId);
  if (!route.indexable || route.canonical.strategy === "none") {
    return null;
  }
  if (route.canonical.strategy === "list-root") {
    return route.canonical.basePath;
  }
  if (route.canonical.strategy === "self") {
    return route.path;
  }
  if (route.canonical.strategy === "dynamic-slug") {
    return buildRoute(routeId, options?.params);
  }
  return null;
}
