"use client";

import { useState, useEffect, useCallback } from "react";
import type { AnalyticsSummary } from "../application/analytics-service";
import styles from "./analytics-dashboard.module.css";

export function AnalyticsDashboard() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"pages" | "sources" | "devices" | "events">("pages");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadData = useCallback(async (selectedDays: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?days=${selectedDays}`);
      if (res.ok) {
        const json: AnalyticsSummary = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(days);
  }, [days, loadData]);

  const handleExportCsv = () => {
    if (!data) return;

    const rows: string[][] = [
      ["ULUDOTT Site Analitik Raporu"],
      [`Tarih Aralığı: Son ${days} Gün`, `Rapor Tarihi: ${new Date().toISOString().slice(0, 10)}`],
      [],
      ["GENEL METRİKLER"],
      ["Toplam Sayfa Görüntüleme", String(data.totalPageViews)],
      ["Tekil Ziyaretçi", String(data.uniqueVisitors)],
      ["Canlı Ziyaretçi (Son 15 dk)", String(data.activeVisitorsNow)],
      ["Ziyaretçi Başına Sayfa", String(data.viewsPerVisitor)],
      ["Toplam Etkinlik & Olay", String(data.totalEvents)],
      ["Fanzin İndirmeleri", String(data.totalFanzinDownloads)],
      [],
      ["EN ÇOK ZİYARET EDİLEN SAYFALAR"],
      ["Sayfa Rotası", "Görüntüleme", "Tekil Ziyaretçi", "Pay (%)"],
      ...data.topPages.map((p) => [p.path, String(p.views), String(p.uniqueVisitors), `%${p.percentage}`]),
      [],
      ["GÜNLÜK ZİYARETÇİ DAĞILIMI"],
      ["Tarih", "Görüntüleme", "Tekil Ziyaretçi"],
      ...data.dailyViews.map((d) => [d.date, String(d.views), String(d.uniqueVisitors)]),
      [],
      ["TRAFİK KAYNAKLARI"],
      ["Kaynak Host", "Kategori", "Ziyaret", "Pay (%)"],
      ...data.topReferrers.map((r) => [r.host, r.category, String(r.count), `%${r.percentage}`]),
      [],
      ["CİHAZ DAĞILIMI"],
      ["Cihaz Türü", "Ziyaret", "Pay (%)"],
      ...data.devices.map((d) => [d.name, String(d.count), `%${d.percentage}`]),
    ];

    const csvContent = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uludott-analitik-${days}gun-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !data) {
    return <div className={styles.loading}>Analitik verileri yükleniyor...</div>;
  }

  const maxViews = data?.dailyViews && data.dailyViews.length > 0
    ? Math.max(...data.dailyViews.map((d) => d.views), 1)
    : 1;

  const filteredPages = data?.topPages.filter((page) =>
    page.path.toLowerCase().includes(searchQuery.toLowerCase().trim()),
  ) || [];

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            <span>SİTE METRİKLERİ & ETKİLEŞİM ANALİZİ</span>
            <span className={styles.liveBadge}>
              <span className={styles.pulseDot} />
              {data?.activeVisitorsNow ?? 0} Canlı
            </span>
          </div>
          <h1 className={styles.title}>SİTE ANALİTİĞİ</h1>
          <p className={styles.subtitle}>
            KVKK ve GDPR uyumlu, üçüncü taraf çerez içermeyen yerel ziyaretçi, cihaz, kaynak ve etkileşim istatistikleri.
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.filterGroup}>
            <button
              type="button"
              className={`${styles.filterBtn} ${days === 1 ? styles.activeFilter : ""}`}
              onClick={() => setDays(1)}
            >
              Bugün
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${days === 7 ? styles.activeFilter : ""}`}
              onClick={() => setDays(7)}
            >
              Son 7 Gün
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${days === 30 ? styles.activeFilter : ""}`}
              onClick={() => setDays(30)}
            >
              Son 30 Gün
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${days === 90 ? styles.activeFilter : ""}`}
              onClick={() => setDays(90)}
            >
              Son 90 Gün
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${days === 365 ? styles.activeFilter : ""}`}
              onClick={() => setDays(365)}
            >
              Tüm Zamanlar
            </button>
          </div>

          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => loadData(days)}
            title="Verileri yeniden yükle"
          >
            <span>↺</span> Yenile
          </button>

          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleExportCsv}
            title="CSV Raporu Olarak İndir"
          >
            <span>↓</span> CSV İndir
          </button>
        </div>
      </header>

      {/* 6 Ana Metrik Kartı */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>TOPLAM SAYFA GÖRÜNTÜLEME</span>
          <strong className={styles.metricValue}>{data?.totalPageViews ?? 0}</strong>
          <span className={styles.metricSub}>Tüm sayfa ziyaretleri</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>TEKİL ZİYARETÇİ</span>
          <strong className={styles.metricValue} style={{ color: "var(--purple)" }}>
            {data?.uniqueVisitors ?? 0}
          </strong>
          <span className={styles.metricSub}>KVKK anonim tekil cihaz</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>CANLI ZİYARETÇİ</span>
          <strong className={styles.metricValue} style={{ color: "var(--lime)" }}>
            {data?.activeVisitorsNow ?? 0}
          </strong>
          <span className={styles.metricSub}>Son 15 dakikada aktif</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>ZİYARET BAŞINA SAYFA</span>
          <strong className={styles.metricValue} style={{ color: "var(--coral)" }}>
            {data?.viewsPerVisitor ?? 0}
          </strong>
          <span className={styles.metricSub}>Ortalama gezinme derinliği</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>ETKİLEŞİM & OLAYLAR</span>
          <strong className={styles.metricValue} style={{ color: "var(--cream)" }}>
            {data?.totalEvents ?? 0}
          </strong>
          <span className={styles.metricSub}>Fanzin, buton ve aksiyonlar</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>FANZİN İNDİRMELERİ</span>
          <strong className={styles.metricValue} style={{ color: "var(--lime)" }}>
            {data?.totalFanzinDownloads ?? 0}
          </strong>
          <span className={styles.metricSub}>Dijital PDF indirmeleri</span>
        </div>
      </div>

      {/* Günlük Ziyaret Grafiği */}
      <div className={styles.sectionBox}>
        <div className={styles.boxHeader}>
          <h3>GÜNLÜK ZİYARETÇİ VE GÖRÜNTÜLEME DAĞILIMI</h3>
          <div className={styles.chartLegend}>
            <div className={styles.legendItem}>
              <span className={styles.legendDotPurple} />
              <span>Görüntüleme</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDotLime} />
              <span>Tekil Ziyaretçi</span>
            </div>
          </div>
        </div>

        {data?.dailyViews && data.dailyViews.length > 0 ? (
          <div className={styles.chartWrapper}>
            <div className={styles.chartBars}>
              {data.dailyViews.map((day) => {
                const viewsHeight = Math.max((day.views / maxViews) * 100, 6);
                const uniqueHeight = Math.max((day.uniqueVisitors / maxViews) * 100, 4);

                return (
                  <div key={day.date} className={styles.barCol}>
                    <div className={styles.barTooltip}>
                      {day.date}: {day.views} hit / {day.uniqueVisitors} tekil
                    </div>
                    <div className={styles.barGroup}>
                      <div className={styles.barViews} style={{ height: `${viewsHeight}%` }} />
                      <div className={styles.barUniques} style={{ height: `${uniqueHeight}%` }} />
                    </div>
                    <span className={styles.barDate}>{day.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={styles.emptyChart}>
            Seçilen tarih aralığında henüz görüntüleme verisi toplanmamış.
          </div>
        )}
      </div>

      {/* Sekmeli Detay Görünümü */}
      <div className={styles.tabsNav}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "pages" ? styles.activeTabBtn : ""}`}
          onClick={() => setActiveTab("pages")}
        >
          POPÜLER SAYFALAR ({data?.topPages.length ?? 0})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "sources" ? styles.activeTabBtn : ""}`}
          onClick={() => setActiveTab("sources")}
        >
          TRAFİK KAYNAKLARI ({data?.topReferrers.length ?? 0})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "devices" ? styles.activeTabBtn : ""}`}
          onClick={() => setActiveTab("devices")}
        >
          CİHAZ VE SİSTEMLER
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "events" ? styles.activeTabBtn : ""}`}
          onClick={() => setActiveTab("events")}
        >
          ETKİNLİKLER VE FANZİN
        </button>
      </div>

      {/* Tab 1: Popüler Sayfalar */}
      {activeTab === "pages" && (
        <div className={styles.sectionBox}>
          <div className={styles.tableSearchWrapper}>
            <div className={styles.boxTag}>EN ÇOK TIKLANAN SAYFA ROTALARI</div>
            <input
              type="text"
              placeholder="Rota içinde ara..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th style={{ width: "45%" }}>SAYFA ROTASI</th>
                <th style={{ textAlign: "right" }}>GÖRÜNTÜLEME</th>
                <th style={{ textAlign: "right" }}>TEKİL ZİYARETÇİ</th>
                <th style={{ width: "25%", textAlign: "left", paddingLeft: "20px" }}>TRAFİK PAYI</th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.length > 0 ? (
                filteredPages.map((page) => (
                  <tr key={page.path}>
                    <td>
                      <code>{page.path}</code>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "700", color: "var(--cream)" }}>
                      {page.views}
                    </td>
                    <td style={{ textAlign: "right", color: "var(--purple)" }}>
                      {page.uniqueVisitors}
                    </td>
                    <td style={{ paddingLeft: "20px" }}>
                      <div className={styles.progressBarCell}>
                        <div className={styles.miniProgressBar}>
                          <div
                            className={styles.miniProgressFill}
                            style={{ width: `${page.percentage}%` }}
                          />
                        </div>
                        <span style={{ fontSize: "11px", minWidth: "35px" }}>%{page.percentage}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--admin-muted)" }}>
                    Kayıtlı sayfa verisi bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Trafik Kaynakları */}
      {activeTab === "sources" && (
        <div className={styles.sectionBox}>
          <div className={styles.boxHeader}>
            <h3>NEREDEN GELDİLER? (REFERRERS)</h3>
            <span className={styles.boxTag}>GELEN TRAFİK KANALLARI</span>
          </div>

          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th style={{ width: "40%" }}>KAYNAK / ALAN ADI</th>
                <th style={{ width: "20%" }}>KATEGORİ</th>
                <th style={{ textAlign: "right" }}>GİRİŞ SAYISI</th>
                <th style={{ width: "25%", paddingLeft: "20px" }}>ORAN</th>
              </tr>
            </thead>
            <tbody>
              {data?.topReferrers && data.topReferrers.length > 0 ? (
                data.topReferrers.map((ref) => (
                  <tr key={ref.host}>
                    <td>
                      <code>{ref.host}</code>
                    </td>
                    <td>
                      <span className={styles.categoryPill}>{ref.category}</span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "700", color: "var(--cream)" }}>
                      {ref.count}
                    </td>
                    <td style={{ paddingLeft: "20px" }}>
                      <div className={styles.progressBarCell}>
                        <div className={styles.miniProgressBar}>
                          <div
                            className={styles.miniProgressFill}
                            style={{ width: `${ref.percentage}%`, background: "var(--lime)" }}
                          />
                        </div>
                        <span style={{ fontSize: "11px", minWidth: "35px" }}>%{ref.percentage}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--admin-muted)" }}>
                    Henüz kayıtlı kaynak verisi bulunmuyor (Ziyaretlerin çoğu doğrudan giriş).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Cihaz ve Sistemler */}
      {activeTab === "devices" && (
        <div className={styles.threeColGrid}>
          {/* Cihaz Türü */}
          <div className={styles.subCard}>
            <div className={styles.subCardTitle}>
              <span>CİHAZ TÜRÜ</span>
              <span className={styles.boxTag}>DONANIM</span>
            </div>
            <div className={styles.itemList}>
              {data?.devices && data.devices.length > 0 ? (
                data.devices.map((dev) => (
                  <div key={dev.name} className={styles.itemRow}>
                    <div className={styles.itemLabelRow}>
                      <span>{dev.name}</span>
                      <strong>%{dev.percentage} ({dev.count})</strong>
                    </div>
                    <div className={styles.itemMeter}>
                      <div className={styles.itemFillPurple} style={{ width: `${dev.percentage}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.itemSub}>Veri yok</div>
              )}
            </div>
          </div>

          {/* Tarayıcı */}
          <div className={styles.subCard}>
            <div className={styles.subCardTitle}>
              <span>TARAYICILAR</span>
              <span className={styles.boxTag}>BROWSER</span>
            </div>
            <div className={styles.itemList}>
              {data?.browsers && data.browsers.length > 0 ? (
                data.browsers.map((b) => (
                  <div key={b.name} className={styles.itemRow}>
                    <div className={styles.itemLabelRow}>
                      <span>{b.name}</span>
                      <strong>%{b.percentage} ({b.count})</strong>
                    </div>
                    <div className={styles.itemMeter}>
                      <div className={styles.itemFillLime} style={{ width: `${b.percentage}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.itemSub}>Veri yok</div>
              )}
            </div>
          </div>

          {/* İşletim Sistemi */}
          <div className={styles.subCard}>
            <div className={styles.subCardTitle}>
              <span>İŞLETİM SİSTEMLERİ</span>
              <span className={styles.boxTag}>OS</span>
            </div>
            <div className={styles.itemList}>
              {data?.osList && data.osList.length > 0 ? (
                data.osList.map((os) => (
                  <div key={os.name} className={styles.itemRow}>
                    <div className={styles.itemLabelRow}>
                      <span>{os.name}</span>
                      <strong>%{os.percentage} ({os.count})</strong>
                    </div>
                    <div className={styles.itemMeter}>
                      <div className={styles.itemFillCoral} style={{ width: `${os.percentage}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.itemSub}>Veri yok</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Etkinlikler ve Fanzin */}
      {activeTab === "events" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Fanzin Dağılımı */}
          <div className={styles.sectionBox}>
            <div className={styles.boxHeader}>
              <h3>FANZİN SAYILARI İNDİRME VE OKUNMA İSTATİSTİKLERİ</h3>
              <span className={styles.boxTag}>DİJİTAL YAYIN</span>
            </div>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>SAYI & BAŞLIK</th>
                  <th style={{ textAlign: "center" }}>OKUNMA</th>
                  <th style={{ textAlign: "right" }}>İNDİRME</th>
                </tr>
              </thead>
              <tbody>
                {data?.fanzinDownloads && data.fanzinDownloads.length > 0 ? (
                  data.fanzinDownloads.map((issue) => (
                    <tr key={issue.issueNumber}>
                      <td>
                        <strong>#{issue.issueNumber}</strong> {issue.title}
                      </td>
                      <td style={{ textAlign: "center", color: "var(--purple)" }}>
                        {issue.views}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: "700", color: "var(--lime)" }}>
                        {issue.downloads}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", color: "var(--admin-muted)" }}>
                      Kayıtlı fanzin yayını bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Olay Akışı */}
          <div className={styles.sectionBox}>
            <div className={styles.boxHeader}>
              <h3>CANLI ETKİLEŞİM VE OLAY AKIŞI</h3>
              <span className={styles.boxTag}>SON AKSIYONLAR</span>
            </div>

            <div>
              {data?.recentEvents && data.recentEvents.length > 0 ? (
                data.recentEvents.map((event) => (
                  <div key={event.id} className={styles.eventRow}>
                    <div className={styles.eventInfo}>
                      <span className={styles.eventBadge}>{event.eventType}</span>
                      <strong>{event.eventName}</strong>
                      <code>{event.path}</code>
                    </div>
                    <span className={styles.eventTime}>
                      {new Date(event.createdAt).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", color: "var(--admin-muted)", padding: "20px" }}>
                  Henüz kaydedilmiş özel olay akışı yok. Sayfa ziyaretleri ve fanzin indirmeleri gerçekleştikçe burada canlı görünecektir.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
