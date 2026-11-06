"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formRequest } from "../../forms/ui/admin-fetch";
import styles from "./fanzin-admin.module.css";

interface FanzinIssue {
  id: string;
  issueNumber: number;
  title: string;
  slug: string;
  subtitle?: string | null;
  season: string;
  year: number;
  description: string;
  pageCount: number;
  pdfUrl: string;
  pdfFileSize?: string | null;
  coverImageUrl?: string | null;
  status: string;
  downloadCount: number;
  viewCount: number;
}

export function FanzinAdminList() {
  const [issues, setIssues] = useState<FanzinIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/fanzin");
      if (res.ok) {
        const json = await res.json();
        setIssues(json);
      }
    } catch (err) {
      console.error("Failed to load fanzin issues:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Bu fanzin sayısını silmek istediğinize emin misiniz?")) return;
    setDeletingId(id);
    try {
      await formRequest(`/api/admin/fanzin/${id}`, {}, "DELETE");
      setIssues(issues.filter((i) => i.id !== id));
    } catch (err: unknown) {
      alert("Silinemedi: " + (err instanceof Error ? err.message : "Hata"));
    } finally {
      setDeletingId(null);
    }
  }

  const publishedCount = issues.filter((i) => i.status === "published").length;
  const totalViews = issues.reduce((acc, curr) => acc + (curr.viewCount || 0), 0);
  const totalDownloads = issues.reduce((acc, curr) => acc + (curr.downloadCount || 0), 0);

  if (loading) return <div className={styles.loading}>Fanzin sayıları yükleniyor...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>DİJİTAL YAYIN & ARŞİV</span>
          <h1 className={styles.title}>FANZİN YÖNETİMİ</h1>
          <p className={styles.subtitle}>
            Uludott Fanzin sayılarını, PDF dosyalarını ve çift sayfa flipbook içeriklerini yönetin.
          </p>
        </div>
        <div>
          <Link href="/admin/fanzin/yeni" className={styles.createBtn}>
            + YENİ SAYI EKLE
          </Link>
        </div>
      </header>

      {/* İstatistik Sayaçları */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>TOPLAM SAYI</span>
          <strong className={styles.statValue}>{issues.length}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>YAYINDA</span>
          <strong className={styles.statValue} style={{ color: "var(--lime)" }}>
            {publishedCount}
          </strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>TOPLAM OKUNMA</span>
          <strong className={styles.statValue} style={{ color: "var(--purple)" }}>
            {totalViews}
          </strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>TOPLAM İNDİRİLME</span>
          <strong className={styles.statValue} style={{ color: "var(--coral)" }}>
            {totalDownloads}
          </strong>
        </div>
      </div>

      {/* Sayı Listesi Tablosu */}
      <div className={styles.listBox}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>KAPAK</th>
              <th>SAYI NO & BAŞLIK</th>
              <th>DÖNEM / YIL</th>
              <th>SAYFA</th>
              <th>PDF BOYUTU</th>
              <th>DURUM</th>
              <th style={{ textAlign: "right" }}>AKSİYONLAR</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((item) => (
              <tr key={item.id}>
                <td style={{ width: "60px" }}>
                  <div className={styles.coverThumbnail}>
                    <Image
                      src={item.coverImageUrl || "/community/02-ulujam/ulujam-vlog-kapak.webp"}
                      alt=""
                      width={48}
                      height={68}
                      style={{ objectFit: "cover" }}
                      unoptimized
                    />
                  </div>
                </td>
                <td>
                  <strong>Sayı #{String(item.issueNumber).padStart(2, "0")}: {item.title}</strong>
                  {item.subtitle && <p className={styles.itemSubtitle}>{item.subtitle}</p>}
                </td>
                <td>{item.season} {item.year}</td>
                <td>{item.pageCount} sf.</td>
                <td>{item.pdfFileSize || "—"}</td>
                <td>
                  <span className={`${styles.badge} ${styles["badge_" + item.status]}`}>
                    {
                      {
                        published: "YAYINDA",
                        draft: "TASLAK",
                        upcoming: "YAKINDA",
                        archived: "ARŞİV",
                      }[item.status] || item.status
                    }
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <Link href={`/admin/fanzin/${item.id}`} className={styles.editBtn}>
                      Düzenle
                    </Link>
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id)}
                      className={styles.deleteBtn}
                    >
                      {deletingId === item.id ? "..." : "Sil"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {issues.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "48px", color: "var(--admin-muted)" }}>
                  Henüz fanzin sayısı bulunmuyor. Sağ üstteki "+ Yeni Sayı Ekle" butonuna tıklayarak ilk sayıyı oluşturun.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
