import { getDatabase } from "../src/lib/database/client.ts";
import { sitePageViews, siteAnalyticsEvents } from "../src/db/schema/analytics.ts";
import { count } from "drizzle-orm";
import { createHash } from "node:crypto";

async function main() {
  const db = getDatabase();
  const [existing] = await db.select({ total: count() }).from(sitePageViews);

  if (existing && existing.total > 0) {
    console.log(`[analytics seed] Tabloda zaten ${existing.total} kayıt var, seed atlandı.`);
    process.exit(0);
  }

  console.log("[analytics seed] Örnek analitik verileri üretiliyor...");

  const paths = [
    { path: "/", weight: 35 },
    { path: "/fanzin", weight: 22 },
    { path: "/oyunlar", weight: 15 },
    { path: "/etkinlikler", weight: 12 },
    { path: "/hakkimizda", weight: 8 },
    { path: "/iletisim", weight: 5 },
    { path: "/sozluk", weight: 3 },
  ];

  const referrers = [
    { host: null, weight: 45 },
    { host: "google.com", weight: 25 },
    { host: "instagram.com", weight: 15 },
    { host: "t.co", weight: 10 },
    { host: "discord.com", weight: 5 },
  ];

  const devices = [
    { type: "desktop", browser: "Chrome", os: "macOS", weight: 30 },
    { type: "desktop", browser: "Chrome", os: "Windows", weight: 25 },
    { type: "mobile", browser: "Safari", os: "iOS", weight: 22 },
    { type: "mobile", browser: "Chrome", os: "Android", weight: 13 },
    { type: "desktop", browser: "Firefox", os: "Linux", weight: 6 },
    { type: "tablet", browser: "Safari", os: "iOS", weight: 4 },
  ];

  function pickWeighted<T extends { weight: number }>(items: T[]): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const item of items) {
      if (rand < item.weight) return item;
      rand -= item.weight;
    }
    return items[0];
  }

  const now = Date.now();
  const pageViewRows = [];
  const eventRows = [];

  // 30 güne dağıtılmış 160 ziyaret
  for (let i = 0; i < 160; i++) {
    // Son 30 günde rastgele bir zaman damgası
    const daysAgo = Math.random() * 29;
    const timestamp = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    const dayStr = timestamp.toISOString().slice(0, 10);

    const pickedPath = pickWeighted(paths).path;
    const pickedRef = pickWeighted(referrers).host;
    const pickedDev = pickWeighted(devices);

    const ip = `192.168.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 250)}`;
    const visitorHash = createHash("sha256")
      .update(`${ip}:${pickedDev.browser}:${dayStr}`)
      .digest("hex")
      .slice(0, 32);

    pageViewRows.push({
      path: pickedPath,
      visitorHash,
      refererHost: pickedRef,
      userAgent: `Mozilla/5.0 (${pickedDev.os}) AppleWebKit/537.36 (KHTML, like Gecko) ${pickedDev.browser}/120.0.0.0 Safari/537.36`,
      deviceType: pickedDev.type,
      browser: pickedDev.browser,
      os: pickedDev.os,
      durationSeconds: Math.floor(Math.random() * 180) + 10,
      createdAt: timestamp,
    });

    // Bazı ziyaretlerde olay tetiklensin
    if (Math.random() < 0.25) {
      const eventTypes = [
        { type: "fanzin_read", name: "Fanzin Sayı Okuma", path: "/fanzin" },
        { type: "fanzin_download", name: "Fanzin PDF İndirme", path: "/fanzin" },
        { type: "game_view", name: "Oyun Detay Kartı", path: "/oyunlar" },
        { type: "outbound_click", name: "Sosyal Medya Tıklaması", path: "/" },
      ];
      const ev = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      eventRows.push({
        eventType: ev.type,
        eventName: ev.name,
        path: ev.path,
        visitorHash,
        metadata: JSON.stringify({ source: "web_client" }),
        createdAt: timestamp,
      });
    }
  }

  // Son 15 dakikada aktif 3 canlı ziyaretçi ekle
  for (let c = 0; c < 4; c++) {
    const liveTime = new Date(now - Math.floor(Math.random() * 10) * 60 * 1000);
    const ip = `10.0.0.${c + 1}`;
    const visitorHash = createHash("sha256")
      .update(`${ip}:live:${new Date().toISOString().slice(0, 10)}`)
      .digest("hex")
      .slice(0, 32);

    pageViewRows.push({
      path: c % 2 === 0 ? "/" : "/fanzin",
      visitorHash,
      refererHost: c === 0 ? "google.com" : null,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      deviceType: "desktop",
      browser: "Chrome",
      os: "macOS",
      durationSeconds: 45,
      createdAt: liveTime,
    });
  }

  // Batch insert
  await db.insert(sitePageViews).values(pageViewRows);
  if (eventRows.length > 0) {
    await db.insert(siteAnalyticsEvents).values(eventRows);
  }

  console.log(`[analytics seed] Başarıyla ${pageViewRows.length} sayfa ziyareti ve ${eventRows.length} olay kaydedildi!`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
