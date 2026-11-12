import "server-only";
import { createHash } from "node:crypto";
import { sql, gte, desc, count, countDistinct } from "drizzle-orm";
import { sitePageViews, siteAnalyticsEvents } from "../../../db/schema/analytics.ts";
import { fanzinIssues } from "../../../db/schema/fanzin.ts";
import { getDatabase } from "../../../lib/database/client.ts";

export interface PageStat {
  path: string;
  views: number;
  uniqueVisitors: number;
  percentage: number;
}

export interface ReferrerStat {
  host: string;
  count: number;
  percentage: number;
  category: "Doğrudan" | "Arama" | "Sosyal" | "Web Sitesi";
}

export interface DistributionStat {
  name: string;
  count: number;
  percentage: number;
}

export interface AnalyticsEventItem {
  id: string;
  eventType: string;
  eventName: string;
  path: string;
  metadata?: string | null;
  createdAt: string;
}

export interface AnalyticsSummary {
  timeRangeDays: number;
  totalPageViews: number;
  uniqueVisitors: number;
  activeVisitorsNow: number;
  viewsPerVisitor: number;
  totalEvents: number;
  totalFanzinDownloads: number;
  topPages: PageStat[];
  dailyViews: { date: string; views: number; uniqueVisitors: number }[];
  topReferrers: ReferrerStat[];
  devices: DistributionStat[];
  browsers: DistributionStat[];
  osList: DistributionStat[];
  topEvents: { eventType: string; eventName: string; count: number }[];
  recentEvents: AnalyticsEventItem[];
  fanzinDownloads: { issueNumber: number; title: string; downloads: number; views: number }[];
}

export function parseUserAgent(
  ua: string,
  screenWidth?: number,
): {
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
} {
  const cleanUa = ua || "";

  // 1. Device Type
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
  if (
    /iPad|Tablet|PlayBook|Silk/i.test(cleanUa) ||
    (screenWidth && screenWidth >= 600 && screenWidth <= 1024 && /Mobile|Android/i.test(cleanUa))
  ) {
    deviceType = "tablet";
  } else if (
    (screenWidth && screenWidth < 600) ||
    /Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(cleanUa)
  ) {
    deviceType = "mobile";
  }

  // 2. Browser
  let browser = "Diğer";
  if (/Edg(e|A|iOS)?\/([0-9]+)/i.test(cleanUa)) {
    browser = "Edge";
  } else if (/OPR\/|Opera/i.test(cleanUa)) {
    browser = "Opera";
  } else if (/SamsungBrowser/i.test(cleanUa)) {
    browser = "Samsung";
  } else if (/Chrome\/([0-9]+)/i.test(cleanUa)) {
    browser = "Chrome";
  } else if (/Safari\/([0-9]+)/i.test(cleanUa)) {
    browser = "Safari";
  } else if (/Firefox\/([0-9]+)/i.test(cleanUa)) {
    browser = "Firefox";
  }

  // 3. Operating System
  let os = "Diğer";
  if (/Windows/i.test(cleanUa)) {
    os = "Windows";
  } else if (/iPhone|iPad|iPod/i.test(cleanUa)) {
    os = "iOS";
  } else if (/Macintosh|Mac OS X/i.test(cleanUa)) {
    os = "macOS";
  } else if (/Android/i.test(cleanUa)) {
    os = "Android";
  } else if (/Linux/i.test(cleanUa)) {
    os = "Linux";
  }

  return { deviceType, browser, os };
}

export function isBot(ua: string): boolean {
  return /Googlebot|bingbot|Baiduspider|YandexBot|crawler|spider|DuckDuckBot|Slurp|facebookexternalhit|LinkedInBot|Bytespider|HeadlessChrome/i.test(
    ua,
  );
}

export function categorizeReferrer(host: string | null): "Doğrudan" | "Arama" | "Sosyal" | "Web Sitesi" {
  if (!host) return "Doğrudan";
  const h = host.toLowerCase();
  if (
    h.includes("google.") ||
    h.includes("bing.com") ||
    h.includes("yandex.") ||
    h.includes("duckduckgo.com") ||
    h.includes("ecosia.org") ||
    h.includes("ya.ru")
  ) {
    return "Arama";
  }
  if (
    h.includes("instagram.com") ||
    h.includes("twitter.com") ||
    h.includes("t.co") ||
    h.includes("x.com") ||
    h.includes("facebook.com") ||
    h.includes("linkedin.com") ||
    h.includes("youtube.com") ||
    h.includes("discord.com") ||
    h.includes("reddit.com") ||
    h.includes("tiktok.com") ||
    h.includes("whatsapp.com") ||
    h.includes("telegram.org")
  ) {
    return "Sosyal";
  }
  return "Web Sitesi";
}

export async function recordPageView(options: {
  path: string;
  ip?: string;
  userAgent?: string;
  referer?: string;
  screenWidth?: number;
  durationSeconds?: number;
}) {
  try {
    const rawUa = options.userAgent || "";
    if (isBot(rawUa)) return;

    let cleanPath = options.path.split("?")[0].trim();
    if (!cleanPath.startsWith("/")) cleanPath = `/${cleanPath}`;
    if (cleanPath.startsWith("/admin") || cleanPath.startsWith("/api")) return;

    const rawIp = options.ip || "127.0.0.1";
    const dateSalt = new Date().toISOString().slice(0, 10);
    // KVKK uyumlu günlük tuzlanmış hash (kişisel veri tutulmaz)
    const visitorHash = createHash("sha256")
      .update(`${rawIp}:${rawUa.slice(0, 100)}:${dateSalt}`)
      .digest("hex")
      .slice(0, 32);

    let refererHost: string | null = null;
    if (options.referer) {
      try {
        const parsed = new URL(options.referer);
        refererHost = parsed.hostname.toLowerCase();
      } catch {
        // Geçersiz URL yoksayılır
      }
    }

    const { deviceType, browser, os } = parseUserAgent(rawUa, options.screenWidth);

    await getDatabase().insert(sitePageViews).values({
      path: cleanPath.slice(0, 255),
      visitorHash,
      refererHost: refererHost ? refererHost.slice(0, 255) : null,
      userAgent: rawUa.slice(0, 255),
      deviceType,
      browser,
      os,
      durationSeconds: options.durationSeconds ?? null,
    });
  } catch (error) {
    console.error("[analytics] failed to record view:", error);
  }
}

export async function recordEvent(options: {
  eventType: string;
  eventName: string;
  path: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown> | null;
}) {
  try {
    const rawUa = options.userAgent || "";
    if (isBot(rawUa)) return;

    const rawIp = options.ip || "127.0.0.1";
    const dateSalt = new Date().toISOString().slice(0, 10);
    const visitorHash = createHash("sha256")
      .update(`${rawIp}:${rawUa.slice(0, 100)}:${dateSalt}`)
      .digest("hex")
      .slice(0, 32);

    let cleanPath = options.path.split("?")[0].trim();
    if (!cleanPath.startsWith("/")) cleanPath = `/${cleanPath}`;

    await getDatabase().insert(siteAnalyticsEvents).values({
      eventType: options.eventType.slice(0, 64),
      eventName: options.eventName.slice(0, 128),
      path: cleanPath.slice(0, 255),
      visitorHash,
      metadata: options.metadata ? JSON.stringify(options.metadata).slice(0, 2000) : null,
    });
  } catch (error) {
    console.error("[analytics] failed to record event:", error);
  }
}

export async function getAnalyticsSummary(days: number = 30): Promise<AnalyticsSummary> {
  const db = getDatabase();
  const safeDays = Math.max(1, Math.min(365, days));
  const startDate = new Date();
  if (safeDays === 1) {
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate.setDate(startDate.getDate() - safeDays);
  }

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  try {
    // 1. Toplam Görüntüleme & Tekil Ziyaretçi
    const [totals] = await db
      .select({
        totalViews: count(),
        uniqueVisitors: countDistinct(sitePageViews.visitorHash),
      })
      .from(sitePageViews)
      .where(gte(sitePageViews.createdAt, startDate));

    const totalViewsCount = totals?.totalViews || 0;
    const uniqueVisitorsCount = totals?.uniqueVisitors || 0;

    // 2. Canlı Ziyaretçi (Son 15 dakika)
    const [activeNow] = await db
      .select({
        activeVisitors: countDistinct(sitePageViews.visitorHash),
      })
      .from(sitePageViews)
      .where(gte(sitePageViews.createdAt, fifteenMinutesAgo));

    const activeVisitorsNow = activeNow?.activeVisitors || 0;

    // 3. Toplam Etkinlikler
    const [eventsTotal] = await db
      .select({
        total: count(),
      })
      .from(siteAnalyticsEvents)
      .where(gte(siteAnalyticsEvents.createdAt, startDate));

    const totalEvents = eventsTotal?.total || 0;

    // 4. En Çok Ziyaret Edilen Sayfalar
    const topPagesRaw = await db
      .select({
        path: sitePageViews.path,
        views: count(),
        uniqueVisitors: countDistinct(sitePageViews.visitorHash),
      })
      .from(sitePageViews)
      .where(gte(sitePageViews.createdAt, startDate))
      .groupBy(sitePageViews.path)
      .orderBy(desc(count()))
      .limit(15);

    const topPages: PageStat[] = topPagesRaw.map((p) => ({
      path: p.path,
      views: p.views,
      uniqueVisitors: p.uniqueVisitors,
      percentage: totalViewsCount > 0 ? Math.round((p.views / totalViewsCount) * 100) : 0,
    }));

    // 5. Günlük Dağılım
    const dailyViewsRaw = await db
      .select({
        date: sql<string>`to_char(${sitePageViews.createdAt}, 'YYYY-MM-DD')`,
        views: count(),
        uniqueVisitors: countDistinct(sitePageViews.visitorHash),
      })
      .from(sitePageViews)
      .where(gte(sitePageViews.createdAt, startDate))
      .groupBy(sql`to_char(${sitePageViews.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${sitePageViews.createdAt}, 'YYYY-MM-DD')`);

    // 6. Trafik Kaynakları (Referrers)
    const referrersRaw = await db
      .select({
        host: sitePageViews.refererHost,
        count: count(),
      })
      .from(sitePageViews)
      .where(gte(sitePageViews.createdAt, startDate))
      .groupBy(sitePageViews.refererHost)
      .orderBy(desc(count()))
      .limit(10);

    const topReferrers: ReferrerStat[] = referrersRaw.map((r) => {
      const host = r.host || "Doğrudan";
      return {
        host,
        count: r.count,
        percentage: totalViewsCount > 0 ? Math.round((r.count / totalViewsCount) * 100) : 0,
        category: categorizeReferrer(r.host),
      };
    });

    // 7. Cihaz Türü Dağılımı
    const devicesRaw = await db
      .select({
        type: sql<string>`coalesce(${sitePageViews.deviceType}, 'desktop')`,
        count: count(),
      })
      .from(sitePageViews)
      .where(gte(sitePageViews.createdAt, startDate))
      .groupBy(sql`coalesce(${sitePageViews.deviceType}, 'desktop')`)
      .orderBy(desc(count()));

    const devices: DistributionStat[] = devicesRaw.map((d) => ({
      name: d.type === "mobile" ? "Mobil" : d.type === "tablet" ? "Tablet" : "Masaüstü",
      count: d.count,
      percentage: totalViewsCount > 0 ? Math.round((d.count / totalViewsCount) * 100) : 0,
    }));

    // 8. Tarayıcı Dağılımı
    const browsersRaw = await db
      .select({
        name: sql<string>`coalesce(${sitePageViews.browser}, 'Diğer')`,
        count: count(),
      })
      .from(sitePageViews)
      .where(gte(sitePageViews.createdAt, startDate))
      .groupBy(sql`coalesce(${sitePageViews.browser}, 'Diğer')`)
      .orderBy(desc(count()))
      .limit(6);

    const browsers: DistributionStat[] = browsersRaw.map((b) => ({
      name: b.name,
      count: b.count,
      percentage: totalViewsCount > 0 ? Math.round((b.count / totalViewsCount) * 100) : 0,
    }));

    // 9. İşletim Sistemi Dağılımı
    const osRaw = await db
      .select({
        name: sql<string>`coalesce(${sitePageViews.os}, 'Diğer')`,
        count: count(),
      })
      .from(sitePageViews)
      .where(gte(sitePageViews.createdAt, startDate))
      .groupBy(sql`coalesce(${sitePageViews.os}, 'Diğer')`)
      .orderBy(desc(count()))
      .limit(6);

    const osList: DistributionStat[] = osRaw.map((o) => ({
      name: o.name,
      count: o.count,
      percentage: totalViewsCount > 0 ? Math.round((o.count / totalViewsCount) * 100) : 0,
    }));

    // 10. Öne Çıkan Olaylar & Son Canlı Olaylar
    const topEventsRaw = await db
      .select({
        eventType: siteAnalyticsEvents.eventType,
        eventName: siteAnalyticsEvents.eventName,
        count: count(),
      })
      .from(siteAnalyticsEvents)
      .where(gte(siteAnalyticsEvents.createdAt, startDate))
      .groupBy(siteAnalyticsEvents.eventType, siteAnalyticsEvents.eventName)
      .orderBy(desc(count()))
      .limit(8);

    const recentEventsRaw = await db
      .select({
        id: siteAnalyticsEvents.id,
        eventType: siteAnalyticsEvents.eventType,
        eventName: siteAnalyticsEvents.eventName,
        path: siteAnalyticsEvents.path,
        metadata: siteAnalyticsEvents.metadata,
        createdAt: siteAnalyticsEvents.createdAt,
      })
      .from(siteAnalyticsEvents)
      .orderBy(desc(siteAnalyticsEvents.createdAt))
      .limit(10);

    const recentEvents: AnalyticsEventItem[] = recentEventsRaw.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      eventName: e.eventName,
      path: e.path,
      metadata: e.metadata,
      createdAt: e.createdAt.toISOString(),
    }));

    // 11. Fanzin İndirilme Verileri
    const fanzinData = await db
      .select({
        issueNumber: fanzinIssues.issueNumber,
        title: fanzinIssues.title,
        downloads: fanzinIssues.downloadCount,
        views: fanzinIssues.viewCount,
      })
      .from(fanzinIssues)
      .orderBy(desc(fanzinIssues.issueNumber))
      .limit(10);

    const totalFanzinDownloads = fanzinData.reduce((acc, curr) => acc + (curr.downloads || 0), 0);

    const viewsPerVisitor = uniqueVisitorsCount > 0
      ? Math.round((totalViewsCount / uniqueVisitorsCount) * 10) / 10
      : 0;

    return {
      timeRangeDays: safeDays,
      totalPageViews: totalViewsCount,
      uniqueVisitors: uniqueVisitorsCount,
      activeVisitorsNow,
      viewsPerVisitor,
      totalEvents,
      totalFanzinDownloads,
      topPages,
      dailyViews: dailyViewsRaw,
      topReferrers,
      devices,
      browsers,
      osList,
      topEvents: topEventsRaw,
      recentEvents,
      fanzinDownloads: fanzinData,
    };
  } catch (error) {
    console.error("[analytics] failed to compute summary:", error);
    return {
      timeRangeDays: safeDays,
      totalPageViews: 0,
      uniqueVisitors: 0,
      activeVisitorsNow: 0,
      viewsPerVisitor: 0,
      totalEvents: 0,
      totalFanzinDownloads: 0,
      topPages: [],
      dailyViews: [],
      topReferrers: [],
      devices: [],
      browsers: [],
      osList: [],
      topEvents: [],
      recentEvents: [],
      fanzinDownloads: [],
    };
  }
}
