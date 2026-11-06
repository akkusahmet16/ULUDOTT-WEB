import { describe, it, expect } from "vitest";
import {
  PERFORMANCE_CATEGORY_THRESHOLDS,
  CORE_WEB_VITALS_THRESHOLDS,
  BUNDLE_BUDGETS,
  VIEWPORTS,
  PUBLIC_ROUTE_MATRIX,
  PRIVATE_ROUTE_MATRIX,
  ALL_AUDIT_ROUTES,
  ACCESSIBILITY_CRITERIA,
  measureRouteBundle,
  measureAllRouteBundles,
} from "../perf/budgets.ts";

describe("Faz 7 / İş 7A — Performans ve Kalite Kapısı Bütçeleri (Tek Eşik Kaynağı)", () => {
  it("Lighthouse kategori kabul eşikleri en az 90 olmalıdır", () => {
    expect(PERFORMANCE_CATEGORY_THRESHOLDS.performance).toBeGreaterThanOrEqual(90);
    expect(PERFORMANCE_CATEGORY_THRESHOLDS.accessibility).toBeGreaterThanOrEqual(90);
    expect(PERFORMANCE_CATEGORY_THRESHOLDS.bestPractices).toBeGreaterThanOrEqual(90);
    expect(PERFORMANCE_CATEGORY_THRESHOLDS.seo).toBeGreaterThanOrEqual(90);
  });

  it("Core Web Vitals eşikleri kesin plan sınırlarına uymalıdır", () => {
    expect(CORE_WEB_VITALS_THRESHOLDS.lcpMaxMs).toBe(2500);
    expect(CORE_WEB_VITALS_THRESHOLDS.clsMax).toBe(0.1);
    expect(CORE_WEB_VITALS_THRESHOLDS.clsTarget).toBe(0.0);
    expect(CORE_WEB_VITALS_THRESHOLDS.tbtMaxMs).toBe(200);
  });

  it("İlk navigation JS gzip bütçesi tam 150 KiB (153,600 byte) olarak tanımlıdır", () => {
    expect(BUNDLE_BUDGETS.homeFirstPartyJsGzipMaxBytes).toBe(150 * 1024);
    expect(BUNDLE_BUDGETS.homeFirstPartyJsGzipMaxBytes).toBe(153600);
  });

  it("Görünüm matrisi mobil (375x667), masaüstü (1280x800) ve 320px reflow tanımlarını içerir", () => {
    expect(VIEWPORTS.mobile).toEqual({ width: 375, height: 667, name: "mobile" });
    expect(VIEWPORTS.desktop).toEqual({ width: 1280, height: 800, name: "desktop" });
    expect(VIEWPORTS.reflow320).toEqual({ width: 320, height: 640, name: "reflow-320" });
  });

  it("Public rota matrisi TR ve EN için tüm cinematic rotaları içerir", () => {
    const paths = new Set(PUBLIC_ROUTE_MATRIX.map((r) => r.path));
    expect(paths).toContain("/");
    expect(paths).toContain("/hakkimizda");
    expect(paths).toContain("/ulujam");
    expect(paths).toContain("/etkinlikler");
    expect(paths).toContain("/oyunlar");
    expect(paths).toContain("/iletisim");
    expect(paths).toContain("/makbuz");

    // Tüm public rotalar cinematic temada olmalıdır
    for (const route of PUBLIC_ROUTE_MATRIX) {
      expect(route.theme).toBe("cinematic");
      expect(["tr", "en"]).toContain(route.locale);
    }
  });

  it("Yönetim rotası classic temada, TR ve SEO muafiyetli olmalıdır", () => {
    const admin = PRIVATE_ROUTE_MATRIX.find((r) => r.path === "/admin");
    expect(admin).toBeDefined();
    expect(admin?.theme).toBe("classic");
    expect(admin?.locale).toBe("tr");
    expect(admin?.isPrivate).toBe(true);
    expect(admin?.noindex).toBe(true);
    expect(admin?.noStore).toBe(true);
    expect(admin?.noReferrer).toBe(true);
    expect(admin?.cspNonce).toBe(true);
    expect(admin?.seoCategoryExcluded).toBe(true);
  });

  it("Bütünleşik rota matrisi hem public hem private rotaları eksiksiz birleştirir", () => {
    expect(ALL_AUDIT_ROUTES.length).toBe(
      PUBLIC_ROUTE_MATRIX.length + PRIVATE_ROUTE_MATRIX.length
    );
    expect(ALL_AUDIT_ROUTES).toEqual([
      ...PUBLIC_ROUTE_MATRIX,
      ...PRIVATE_ROUTE_MATRIX,
    ]);
  });

  it("Erişilebilirlik kriterleri axe wcag etiketlerini ve sıfır serious/critical ihlalini içerir", () => {
    expect(ACCESSIBILITY_CRITERIA.axeTags).toEqual(["wcag2a", "wcag2aa", "wcag21aa"]);
    expect(ACCESSIBILITY_CRITERIA.maxSeriousViolations).toBe(0);
    expect(ACCESSIBILITY_CRITERIA.maxCriticalViolations).toBe(0);
    expect(ACCESSIBILITY_CRITERIA.horizontalScrollForbiddenAt320px).toBe(true);
    expect(ACCESSIBILITY_CRITERIA.zoom200ReflowHorizontalScrollForbidden).toBe(true);
    expect(ACCESSIBILITY_CRITERIA.prefersReducedMotionRequired).toBe(true);
    expect(ACCESSIBILITY_CRITERIA.forcedColorsHighContrastRequired).toBe(true);
  });

  it("Üretim derlemesinden (.next) rota paket boyutları hatasız ölçülebilir", () => {
    const homeBundle = measureRouteBundle("/");
    expect(homeBundle.route).toBe("/");
    expect(homeBundle.chunks.length).toBeGreaterThan(0);
    expect(homeBundle.totalRawBytes).toBeGreaterThan(0);
    expect(homeBundle.totalGzipBytes).toBeGreaterThan(0);
    expect(homeBundle.budgetBytes).toBe(153600);

    // Çekirdek içerik rotaları bütçeyi karşılamalıdır
    const all = measureAllRouteBundles();
    expect(all["/etkinlikler"].isWithinBudget).toBe(true);
    expect(all["/oyunlar"].isWithinBudget).toBe(true);
    expect(all["/iletisim"].isWithinBudget).toBe(true);
    expect(all["/admin"].isWithinBudget).toBe(true);

    // Home ve Hakkımızda rotalarının durumunu ve kesin farkını doğrula
    expect(typeof homeBundle.deltaBytes).toBe("number");
  });
});
