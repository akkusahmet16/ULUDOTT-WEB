import "server-only";
import { createHash } from "node:crypto";
import { sql, gte, desc, count, countDistinct } from "drizzle-orm";
import { sitePageViews } from "../../../db/schema/analytics.ts";
import { fanzinIssues } from "../../../db/schema/fanzin.ts";
import { getDatabase } from "../../../lib/database/client.ts";

export interface AnalyticsSummary {
  totalPageViews: number;
  uniqueVisitors: number;
  totalFanzinDownloads: number;
  topPages: { path: string; views: number }[];
  dailyViews: { date: string; views: number; uniqueVisitors: number }[];
  fanzinDownloads: { issueNumber: number; title: string; downloads: number; views: number }[];
}

export async function recordPageView(options: {
  path: string;
  ip?: string;
  userAgent?: string;
  referer?: string;
}) {
  try {
    const rawIp = options.ip || "127.0.0.1";
    const rawUa = options.userAgent || "";
    // KVKK uyumlu tuzlanmış hash (kişisel veri tutulmaz)
    const visitorHash = createHash("sha256")
      .update(`${rawIp}:${rawUa.slice(0, 100)}:${new Date().toISOString().slice(0, 10)}`)
      .digest("hex")
      .slice(0, 32);

    let refererHost: string | null = null;
    if (options.referer) {
      try {
        refererHost = new URL(options.referer).hostname;
      } catch {
        // Geçersiz URL yoksayılır
      }
    }

    await getDatabase().insert(sitePageViews).values({
      path: options.path.slice(0, 255),
      visitorHash,
      refererHost,
      userAgent: rawUa.slice(0, 255),
    });
  } catch (error) {
    console.error("[analytics] failed to record view:", error);
  }
}

export async function getAnalyticsSummary(days: number = 30): Promise<AnalyticsSummary> {
  const db = getDatabase();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // 1. Toplam Görüntüleme & Tekil Ziyaretçi
    const [totals] = await db
      .select({
        totalViews: count(),
        uniqueVisitors: countDistinct(sitePageViews.visitorHash),
      })
      .from(sitePageViews)
      .where(gte(sitePageViews.createdAt, startDate));

    // 2. En Çok Ziyaret Edilen Sayfalar
    const topPages = await db
      .select({
        path: sitePageViews.path,
        views: count(),
      })
      .from(sitePageViews)
      .where(gte(sitePageViews.createdAt, startDate))
      .groupBy(sitePageViews.path)
      .orderBy(desc(count()))
      .limit(10);

    // 3. Günlük Dağılım
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

    // 4. Fanzin İndirilme Verileri
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

    return {
      totalPageViews: totals?.totalViews || 0,
      uniqueVisitors: totals?.uniqueVisitors || 0,
      totalFanzinDownloads,
      topPages,
      dailyViews: dailyViewsRaw,
      fanzinDownloads: fanzinData,
    };
  } catch (error) {
    console.error("[analytics] failed to compute summary:", error);
    return {
      totalPageViews: 0,
      uniqueVisitors: 0,
      totalFanzinDownloads: 0,
      topPages: [],
      dailyViews: [],
      fanzinDownloads: [],
    };
  }
}
