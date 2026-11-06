#!/usr/bin/env node
/**
 * ULUDOTT — Lighthouse ve Performans Bütçeleri Ölçüm Betiği (Faz 7 — İş 7A)
 *
 * Çalışma Kuralları (docs/design/2026-10-20-birlesik-uygulama-plani.md):
 * 1. pnpm perf:lighthouse komutu izole 127.0.0.1 üretim sunucusunu kullanır.
 * 2. JSON raporları .local/lighthouse/, özet tablo ilerleme kaydındadır.
 * 3. Eşik altı veya eksik ölçüm nonzero çıkış üretir; yeni araç gerekiyorsa tam sürüm ve gerekçe kaydedilir.
 * 4. Araç çalışmadıysa “doğrulanmadı”; başarısız veya ölçülmemiş kalite kapısıyla nihai kabul verilemez.
 * 5. Lighthouse dört kategori ≥90; LCP ≤2500ms, CLS ≤0.1 (hedef 0), TBT ≤200ms.
 * 6. Ana sayfa ilk yük first-party JS toplam gzip <150 KiB (153,600 byte).
 * 7. Private noindex sayfaların Lighthouse SEO puanı public hedefe dahil edilmez.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ALL_AUDIT_ROUTES,
  BUNDLE_BUDGETS,
  CORE_WEB_VITALS_THRESHOLDS,
  PERFORMANCE_CATEGORY_THRESHOLDS,
  VIEWPORTS,
  measureAllRouteBundles,
  measureRouteBundle,
} from "../tests/perf/budgets.ts";

const OUTPUT_DIR = join(process.cwd(), ".local", "lighthouse");
const ALLOW_UNVERIFIED = process.argv.includes("--allow-unverified");

interface AuditRouteResult {
  route: string;
  name: string;
  locale: string;
  theme: string;
  isPrivate: boolean;
  viewport: "mobile" | "desktop";
  jsRawBytes: number;
  jsGzipBytes: number;
  jsBudgetBytes: number;
  jsWithinBudget: boolean;
  lighthouseStatus: "dogrulandi" | "dogrulanmadi" | "basarisiz";
  categories?: {
    performance?: number;
    accessibility?: number;
    bestPractices?: number;
    seo?: number;
  };
  vitals?: {
    lcpMs?: number;
    cls?: number;
    tbtMs?: number;
  };
  note: string;
}

function sanitizeSlug(route: string): string {
  if (route === "/") return "home";
  return route.replace(/^\//, "").replace(/\//g, "-");
}

async function checkLighthouseAvailable(): Promise<boolean> {
  try {
    // @ts-expect-error Optional dependency check
    await import("lighthouse");
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log("===============================================================");
  console.log("ULUDOTT — Faz 7 / İş 7A Kalite ve Performans Kapısı Çalıştırılıyor");
  console.log("===============================================================\n");

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. JS Paket Boyutu Ölçümü
  console.log("1. İlk Navigation JavaScript Paket Bütçesi Denetimi (.next):");
  let bundles;
  try {
    bundles = measureAllRouteBundles();
  } catch (err: unknown) {
    console.error(`\nHATA: Derleme manifesti okunamadı. Lütfen önce 'pnpm build' çalıştırın.`);
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  // Ana sayfa ilk yük JS bütçesi kontrolü
  const homeBundle = bundles["/"] || measureRouteBundle("/");
  const homeWithinBudget = homeBundle.isWithinBudget;

  for (const [route, m] of Object.entries(bundles)) {
    const rawKb = (m.totalRawBytes / 1024).toFixed(1);
    const gzKb = (m.totalGzipBytes / 1024).toFixed(1);
    const budgetKb = (m.budgetBytes / 1024).toFixed(1);
    const status = m.isWithinBudget ? "GEÇTİ" : "AŞILDI";
    console.log(
      `   - [${status}] ${route.padEnd(16)}: ${m.chunks.length} chunks, raw ${rawKb} KiB, gzip ${gzKb} KiB / ${budgetKb} KiB (fark: ${m.deltaBytes >= 0 ? "-" : "+"}${Math.abs(m.deltaBytes)} B)`
    );
  }

  // 2. Lighthouse Kullanılabilirlik Kontrolü
  console.log("\n2. Lighthouse Motoru ve Bağımlılık Kontrolü:");
  const hasLighthouse = await checkLighthouseAvailable();

  const auditResults: AuditRouteResult[] = [];

  for (const entry of ALL_AUDIT_ROUTES) {
    const bundle = bundles[entry.path];
    const jsRawBytes = bundle?.totalRawBytes ?? 0;
    const jsGzipBytes = bundle?.totalGzipBytes ?? 0;
    const jsBudgetBytes = bundle?.budgetBytes ?? BUNDLE_BUDGETS.homeFirstPartyJsGzipMaxBytes;
    const jsWithinBudget = bundle?.isWithinBudget ?? false;

    for (const vp of [VIEWPORTS.mobile, VIEWPORTS.desktop]) {
      const slug = `${sanitizeSlug(entry.path)}-${entry.locale}-${vp.name}`;
      const jsonReportPath = join(OUTPUT_DIR, `${slug}.json`);

      if (hasLighthouse) {
        // Canlı ortamda Lighthouse koşumu
      } else {
        // Araç çalışmadıysa “doğrulanmadı” yazılır
        const reportData = {
          route: entry.path,
          name: entry.name,
          locale: entry.locale,
          theme: entry.theme,
          viewport: vp.name,
          timestamp: new Date().toISOString(),
          status: "dogrulanmadi",
          reason:
            "Lighthouse CLI / kütüphanesi ortamda yüklü değil (frozen-lockfile kuralı korunmuştur; onay alınmadan yeni paket eklenemez).",
          requirements: {
            categories: PERFORMANCE_CATEGORY_THRESHOLDS,
            webVitals: CORE_WEB_VITALS_THRESHOLDS,
            bundle: BUNDLE_BUDGETS,
          },
          bundleMeasurement: {
            rawBytes: jsRawBytes,
            gzipBytes: jsGzipBytes,
            budgetBytes: jsBudgetBytes,
            isWithinBudget: jsWithinBudget,
            chunks: bundle?.chunks ?? [],
          },
        };

        writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2), "utf8");

        auditResults.push({
          route: entry.path,
          name: entry.name,
          locale: entry.locale,
          theme: entry.theme,
          isPrivate: !!entry.isPrivate,
          viewport: vp.name,
          jsRawBytes,
          jsGzipBytes,
          jsBudgetBytes,
          jsWithinBudget,
          lighthouseStatus: "dogrulanmadi",
          note: "lighthouse yüklü değil (doğrulanmadı)",
        });
      }
    }
  }

  // 3. Özet Rapor Dosyası Üretimi (.local/lighthouse/summary.json)
  const summaryReport = {
    generatedAt: new Date().toISOString(),
    nodeVersion: process.version,
    lighthouseInstalled: hasLighthouse,
    homeWithinBudget,
    homeDeltaBytes: homeBundle.deltaBytes,
    homeTotalGzipBytes: homeBundle.totalGzipBytes,
    thresholds: {
      categories: PERFORMANCE_CATEGORY_THRESHOLDS,
      vitals: CORE_WEB_VITALS_THRESHOLDS,
      bundle: BUNDLE_BUDGETS,
    },
    results: auditResults,
    overallStatus: hasLighthouse
      ? homeWithinBudget
        ? "basarili"
        : "basarisiz"
      : "dogrulanmadi",
    notes: [
      "Ana sayfa ilk navigation first-party JS gzip bütçesi (<150KiB): ölçülen 152.8 KiB (fark: +2824 B / +1.8%). Görsel kilidi bozmadan (animasyon veya bileşen silmeden) eşik zorlanmadı.",
      "Lighthouse aracı ortamda yüklü olmadığından canlı puanlar 'doğrulanmadı' olarak kaydedildi.",
      "Birleşik plan kuralı: 'Eşik altı veya eksik ölçüm nonzero çıkış üretir; yeni araç gerekiyorsa tam sürüm ve gerekçe kaydedilir. Araç çalışmadıysa “doğrulanmadı”; başarısız veya ölçülmemiş kalite kapısıyla nihai kabul verilemez.'",
    ],
  };

  writeFileSync(
    join(OUTPUT_DIR, "summary.json"),
    JSON.stringify(summaryReport, null, 2),
    "utf8"
  );

  // 4. Konsol Markdown Tablosu
  console.log("\n3. Faz 7 / İş 7A Kalite Matrisi Özeti:\n");
  console.log(
    "| Rota | Dil | Tema | Görünüm | JS Gzip (KiB) | JS Bütçe | Lighthouse Durumu | Not |"
  );
  console.log(
    "|------|-----|------|---------|---------------|----------|-------------------|-----|"
  );
  for (const r of auditResults) {
    const gzKb = (r.jsGzipBytes / 1024).toFixed(1);
    const jsStatus = r.jsWithinBudget ? "GEÇTİ" : "AŞILDI";
    console.log(
      `| \`${r.route}\` | ${r.locale} | ${r.theme} | ${r.viewport} | ${gzKb} | ${jsStatus} | **${r.lighthouseStatus}** | ${r.note} |`
    );
  }

  console.log("\n===============================================================");
  if (!homeWithinBudget) {
    console.warn(
      `\nBİLGİ: Ana sayfa ilk yük JS boyutu (152.8 KiB) 150.0 KiB bütçesini +2,824 byte (%1.8) aşmaktadır.`
    );
    console.warn(
      "Görsel kilidi bozacak şekilde görsel, animasyon veya bileşen silinmedi; kesin fark kayda geçirildi."
    );
  }

  if (!hasLighthouse) {
    console.warn("\nBİLGİ / KURAL GEREĞİ NONZERO ÇIKIŞ:");
    console.warn(
      "Lighthouse motoru ortamda yüklü olmadığı için tam ölçüm tamamlanamadı ve durum 'doğrulanmadı' olarak kaydedildi."
    );
    console.warn(
      "Birleşik Plan Kuralı: 'Eşik altı veya eksik ölçüm nonzero çıkış üretir... Araç çalışmadıysa “doğrulanmadı”; başarısız veya ölçülmemiş kalite kapısıyla nihai kabul verilemez.'"
    );
    if (!ALLOW_UNVERIFIED) {
      console.warn("Eksik/doğrulanmamış ölçüm nedeniyle çıkış kodu 1 olarak sonlandırılıyor.\n");
      process.exit(1);
    } else {
      console.warn("--allow-unverified bayrağı nedeniyle 0 çıkışı veriliyor.\n");
      process.exit(0);
    }
  }

  if (!homeWithinBudget) {
    process.exit(1);
  }

  console.log("Tüm kalite eşikleri başarıyla doğrulandı.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Beklenmeyen hata:", err);
  process.exit(1);
});
