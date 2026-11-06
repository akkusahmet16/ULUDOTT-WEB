/**
 * ULUDOTT — Tek Eşik Kaynağı (Faz 7 — İş 7A)
 * Performans, Web Vitals, İlk Yük JS Bütçeleri ve Erişilebilirlik Matrisi.
 *
 * Referans: docs/design/2026-10-20-birlesik-uygulama-plani.md (Satır 277-289)
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

/**
 * Lighthouse Dört Kategori Kabul Eşikleri (≥ 90)
 * Private noindex rotalar SEO kategorisinden muaftır.
 */
export const PERFORMANCE_CATEGORY_THRESHOLDS = {
  performance: 90,
  accessibility: 90,
  bestPractices: 90,
  seo: 90, // Yalnız public rotalar
} as const;

/**
 * Core Web Vitals Kabul Eşikleri
 * - LCP (Largest Contentful Paint) ≤ 2500ms
 * - CLS (Cumulative Layout Shift) ≤ 0.1 (hedef 0.0)
 * - TBT (Total Blocking Time) ≤ 200ms
 */
export const CORE_WEB_VITALS_THRESHOLDS = {
  lcpMaxMs: 2500,
  clsMax: 0.1,
  clsTarget: 0.0,
  tbtMaxMs: 200,
} as const;

/**
 * İlk Navigation JS Paket Bütçesi
 * - Ana sayfa ilk yük first-party JS toplam gzip < 150 KiB (153,600 byte)
 * - Main bundle ile sınırlı değildir; ilk navigation'ın indirttiği
 *   runtime/framework/RSC istemci bağımlılıkları dahildir. Tekrar eden URL bir kez sayılır.
 * - Görsel/animasyon kaldırma, görsel kalite/kırpma veya font değiştirme ile bütçe tutturulmaz.
 */
export const BUNDLE_BUDGETS = {
  homeFirstPartyJsGzipMaxBytes: 150 * 1024, // 153,600 byte
  targetRouteGzipMaxBytes: 150 * 1024,
} as const;

/**
 * Görünüm (Viewport) Matrisi
 * - Mobil: 375x667
 * - Masaüstü: 1280x800
 * - Reflow: 320x640 (yatay taşma yasak, scrollWidth <= innerWidth)
 */
export const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: "mobile" },
  desktop: { width: 1280, height: 800, name: "desktop" },
  reflow320: { width: 320, height: 640, name: "reflow-320" },
} as const;

export interface RouteMatrixEntry {
  path: string;
  locale: "tr" | "en";
  theme: "cinematic" | "classic";
  name: string;
  isPrivate?: boolean;
  noindex?: boolean;
  noStore?: boolean;
  noReferrer?: boolean;
  cspNonce?: boolean;
  seoCategoryExcluded?: boolean;
}

/**
 * Public Rota Matrisi (Cinematic × TR/EN × 375/1280)
 * Çerez tabanlı i18n mimarisiyle her rota TR ve EN olarak test edilir.
 */
export const PUBLIC_ROUTE_MATRIX: readonly RouteMatrixEntry[] = [
  { path: "/", locale: "tr", theme: "cinematic", name: "Ana Sayfa (TR)" },
  { path: "/", locale: "en", theme: "cinematic", name: "Ana Sayfa (EN)" },
  { path: "/hakkimizda", locale: "tr", theme: "cinematic", name: "Hakkımızda (TR)" },
  { path: "/hakkimizda", locale: "en", theme: "cinematic", name: "Hakkımızda (EN)" },
  { path: "/ulujam", locale: "tr", theme: "cinematic", name: "UluJam (TR)" },
  { path: "/ulujam", locale: "en", theme: "cinematic", name: "UluJam (EN)" },
  { path: "/etkinlikler", locale: "tr", theme: "cinematic", name: "Etkinlikler (TR)" },
  { path: "/etkinlikler", locale: "en", theme: "cinematic", name: "Etkinlikler (EN)" },
  { path: "/oyunlar", locale: "tr", theme: "cinematic", name: "Oyunlar (TR)" },
  { path: "/oyunlar", locale: "en", theme: "cinematic", name: "Oyunlar (EN)" },
  { path: "/iletisim", locale: "tr", theme: "cinematic", name: "İletişim (TR)" },
  { path: "/iletisim", locale: "en", theme: "cinematic", name: "İletişim (EN)" },
  { path: "/makbuz", locale: "tr", theme: "cinematic", name: "Makbuz (TR)" },
  { path: "/makbuz", locale: "en", theme: "cinematic", name: "Makbuz (EN)" },
] as const;

/**
 * Private / Yönetim Rota Matrisi (Classic × TR)
 * Private noindex sayfaların Lighthouse SEO puanı public hedefe dahil edilmez.
 */
export const PRIVATE_ROUTE_MATRIX: readonly RouteMatrixEntry[] = [
  {
    path: "/admin",
    locale: "tr",
    theme: "classic",
    name: "Yönetim Paneli Giriş",
    isPrivate: true,
    noindex: true,
    noStore: true,
    noReferrer: true,
    cspNonce: true,
    seoCategoryExcluded: true,
  },
] as const;

/**
 * Bütünleşik Kalite Kapısı Rota Matrisi
 */
export const ALL_AUDIT_ROUTES: readonly RouteMatrixEntry[] = [
  ...PUBLIC_ROUTE_MATRIX,
  ...PRIVATE_ROUTE_MATRIX,
] as const;

/**
 * Erişilebilirlik Kabul Eşikleri
 */
export const ACCESSIBILITY_CRITERIA = {
  axeTags: ["wcag2a", "wcag2aa", "wcag21aa"],
  maxSeriousViolations: 0,
  maxCriticalViolations: 0,
  horizontalScrollForbiddenAt320px: true,
  zoom200ReflowHorizontalScrollForbidden: true,
  prefersReducedMotionRequired: true,
  forcedColorsHighContrastRequired: true,
} as const;

export interface ChunkMeasurement {
  path: string;
  rawBytes: number;
  gzipBytes: number;
}

export interface RouteBundleMeasurement {
  route: string;
  chunks: ChunkMeasurement[];
  totalRawBytes: number;
  totalGzipBytes: number;
  budgetBytes: number;
  isWithinBudget: boolean;
  deltaBytes: number;
  legacyPolyfillChunks?: ChunkMeasurement[];
  legacyPolyfillGzipBytes?: number;
}

interface BuildManifest {
  polyfillFiles?: string[];
  rootMainFiles?: string[];
}

interface PageClientManifest {
  entryJSFiles?: Record<string, string[]>;
}

/**
 * Next.js üretim çıktısından (.next) verilen rota için client-reference manifest dosyasını bulur.
 */
export function getRouteClientManifestPath(
  routePath: string,
  nextDir = ".next"
): string | null {
  const clean = routePath.replace(/^\/en/, "") || "/";

  const candidates: string[] = [];
  if (clean === "/") {
    candidates.push(join(nextDir, "server/app/page_client-reference-manifest.js"));
  } else {
    const segment = clean.replace(/^\//, "");
    candidates.push(
      join(nextDir, `server/app/(public)/${segment}/page_client-reference-manifest.js`),
      join(nextDir, `server/app/${segment}/page_client-reference-manifest.js`),
      join(nextDir, `server/app/(private)/${segment}/page_client-reference-manifest.js`)
    );
  }

  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  return null;
}

/**
 * Verilen rota için ilk navigation'da yüklenen JavaScript dosyalarını ve gzip boyutunu hesaplar.
 */
export function measureRouteBundle(
  routePath: string,
  nextDir = ".next"
): RouteBundleMeasurement {
  const buildManifestPath = join(nextDir, "build-manifest.json");
  if (!existsSync(buildManifestPath)) {
    throw new Error(
      `Next.js derleme manifesti bulunamadı: ${buildManifestPath}. Lütfen önce 'pnpm build' çalıştırın.`
    );
  }

  const buildManifest = JSON.parse(
    readFileSync(buildManifestPath, "utf8")
  ) as BuildManifest;

  const rootFiles = new Set<string>(buildManifest.rootMainFiles || []);
  const polyfillFiles = new Set<string>(buildManifest.polyfillFiles || []);

  const manifestPath = getRouteClientManifestPath(routePath, nextDir);
  if (manifestPath && existsSync(manifestPath)) {
    const rawContent = readFileSync(manifestPath, "utf8");
    const match = rawContent.match(
      /globalThis\.__RSC_MANIFEST\["[^"]+"\]\s*=\s*(\{.+?\});\n/s
    );
    if (match) {
      const pageManifest = JSON.parse(match[1]) as PageClientManifest;
      for (const files of Object.values(pageManifest.entryJSFiles || {})) {
        for (const file of files) {
          rootFiles.add(file);
        }
      }
    }
  }

  const chunks: ChunkMeasurement[] = [];
  let totalRawBytes = 0;
  let totalGzipBytes = 0;

  for (const chunkPath of rootFiles) {
    const fullPath = join(nextDir, chunkPath);
    if (existsSync(fullPath)) {
      const raw = readFileSync(fullPath);
      const gzip = gzipSync(raw);
      const chunk: ChunkMeasurement = {
        path: chunkPath,
        rawBytes: raw.length,
        gzipBytes: gzip.length,
      };
      chunks.push(chunk);
      totalRawBytes += raw.length;
      totalGzipBytes += gzip.length;
    }
  }

  const legacyPolyfillChunks: ChunkMeasurement[] = [];
  let legacyPolyfillGzipBytes = 0;
  for (const polyfillPath of polyfillFiles) {
    const fullPath = join(nextDir, polyfillPath);
    if (existsSync(fullPath)) {
      const raw = readFileSync(fullPath);
      const gzip = gzipSync(raw);
      legacyPolyfillChunks.push({
        path: polyfillPath,
        rawBytes: raw.length,
        gzipBytes: gzip.length,
      });
      legacyPolyfillGzipBytes += gzip.length;
    }
  }

  const budgetBytes = BUNDLE_BUDGETS.homeFirstPartyJsGzipMaxBytes;
  const isWithinBudget = totalGzipBytes <= budgetBytes;
  const deltaBytes = budgetBytes - totalGzipBytes;

  return {
    route: routePath,
    chunks,
    totalRawBytes,
    totalGzipBytes,
    budgetBytes,
    isWithinBudget,
    deltaBytes,
    legacyPolyfillChunks,
    legacyPolyfillGzipBytes,
  };
}

/**
 * Matristeki tüm rotalar için benzersiz JS paket boyutunu ölçer.
 */
export function measureAllRouteBundles(
  nextDir = ".next"
): Record<string, RouteBundleMeasurement> {
  const results: Record<string, RouteBundleMeasurement> = {};
  const uniquePaths = new Set(ALL_AUDIT_ROUTES.map((r) => r.path));
  for (const p of uniquePaths) {
    results[p] = measureRouteBundle(p, nextDir);
  }
  return results;
}
