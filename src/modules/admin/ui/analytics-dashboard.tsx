"use client";
import { useState, useEffect } from "react";
import type { AnalyticsSummary } from "../application/analytics-service";
import styles from "./analytics-dashboard.module.css";

export function AnalyticsDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics?days=${days}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [days]);

  if (loading && !data) {
    return <div className={styles.loading}>Analitik verileri yükleniyor...</div>;
  }

  const maxViews = data?.dailyViews && data.dailyViews.length > 0
    ? Math.max(...data.dailyViews.map((d) => d.views), 1)
    : 1;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>SİTE METRİKLERİ & ETKİLEŞİM</span>
          <h1 className={styles.title}>SİTE ANALİTİĞİ</h1>
          <p className={styles.subtitle}>
            KVKK uyumlu, üçüncü taraf çerez içermeyen gerçek ziyaretçi ve fanzin indirme istatistikleri.
          </p>
        </div>
        <div className={styles.filterGroup}>
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
        </div>
      </header>

      {/* 4 Ana Metrik Kartı */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>TOPLAM SAYFA GÖRÜNTÜLEME</span>
          <strong className={styles.metricValue}>{data?.totalPageViews ?? 0}</strong>
          <span className={styles.metricSub}>Son {days} günde kaydedilen toplam hit</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>TEKİL ZİYARETÇİ</span>
          <strong className={styles.metricValue} style={{ color: "var(--purple)" }}>
            {data?.uniqueVisitors ?? 0}
          </strong>
          <span className={styles.metricSub}>Anonimleştirilmiş tekil günlük cihaz</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>FANZİN İNDİRİLMELERİ</span>
          <strong className={styles.metricValue} style={{ color: "var(--lime)" }}>
            {data?.totalFanzinDownloads ?? 0}
          </strong>
          <span className={styles.metricSub}>Toplam indirilen dijital PDF adedi</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>GÜNLÜK ORTALAMA</span>
          <strong className={styles.metricValue} style={{ color: "var(--coral)" }}>
            {data?.dailyViews && data.dailyViews.length > 0
              ? Math.round((data.totalPageViews / data.dailyViews.length) * 10) / 10
              : 0}
          </strong>
          <span className={styles.metricSub}>Gün başına ortalama sayfa görüntüleme</span>
        </div>
      </div>

      {/* Günlük Ziyaret Grafiği */}
      <div className={styles.sectionBox}>
        <div className={styles.boxHeader}>
          <h3>GÜNLÜK ZİYARETÇİ VE GÖRÜNTÜLEME DAĞILIMI</h3>
          <span className={styles.boxTag}>GÜNLÜK TREND</span>
        </div>
        {data?.dailyViews && data.dailyViews.length > 0 ? (
          <div className={styles.chartWrapper}>
            <div className={styles.chartBars}>
              {data.dailyViews.map((day) => {
                const heightPercent = Math.max((day.views / maxViews) * 100, 6);
                return (
                  <div key={day.date} className={styles.barCol} title={`${day.date}: ${day.views} görüntüleme, ${day.uniqueVisitors} tekil`}>
                    <div className={styles.barFill} style={{ height: `${heightPercent}%` }}>
                      <span className={styles.barTooltip}>{day.views}</span>
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

      {/* Alt Tablolar: Popüler Sayfalar & Fanzin İndirmeleri */}
      <div className={styles.tableGrid}>
        <div className={styles.sectionBox}>
          <div className={styles.boxHeader}>
            <h3>EN ÇOK ZİYARET EDİLEN SAYFALAR</h3>
            <span className={styles.boxTag}>TOP ROTALAR</span>
          </div>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>SAYFA ROTASI</th>
                <th style={{ textAlign: "right" }}>GÖRÜNTÜLEME</th>
              </tr>
            </thead>
            <tbody>
              {data?.topPages && data.topPages.length > 0 ? (
                data.topPages.map((page) => (
                  <tr key={page.path}>
                    <td><code>{page.path}</code></td>
                    <td style={{ textAlign: "right", fontWeight: "700", color: "var(--cream)" }}>
                      {page.views}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} style={{ textAlign: "center", color: "var(--admin-muted)" }}>
                    Kayıtlı sayfa verisi yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.sectionBox}>
          <div className={styles.boxHeader}>
            <h3>FANZİN SAYILARI İNDİRME DURUMU</h3>
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
                    Kayıtlı fanzin indirmesi yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
