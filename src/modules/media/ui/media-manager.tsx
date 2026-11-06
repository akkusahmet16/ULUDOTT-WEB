"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { SiteAsset, SiteAssetKind, SiteAssetScope } from "../domain/site-asset";
import styles from "./media-manager.module.css";

export function MediaManager() {
  const [items, setItems] = useState<SiteAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [selectedKind, setSelectedKind] = useState<"all" | SiteAssetKind>("all");
  const [uploadScope, setUploadScope] = useState<SiteAssetScope>("general");
  const [uploading, setUploading] = useState(false);
  const [copiedPath, setCopiedPath] = useState("");
  const [deletingPath, setDeletingPath] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/site-assets?scope=all", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Medyalar yüklenemedi");
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Medyalar yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const csrfRes = await fetch("/api/admin/csrf", { cache: "no-store" });
      if (!csrfRes.ok) throw new Error("İstek doğrulanamadı");
      const { csrfToken } = await csrfRes.json();

      const formData = new FormData();
      formData.append("scope", uploadScope);
      formData.append("file", file);

      const response = await fetch("/api/admin/site-assets", {
        method: "POST",
        headers: {
          "x-csrf-token": csrfToken,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Dosya yüklenemedi");

      setMessage(`"${data.item.name}" sunucuya başarıyla yüklendi.`);
      setItems((prev) => [data.item, ...prev.filter((i) => i.path !== data.item.path)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dosya yüklenemedi");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(asset: SiteAsset) {
    const confirmed = window.confirm(
      `"${asset.name}" dosyasını sunucudan (VDS) kalıcı olarak silmek istediğinize emin misiniz?\n\nBu dosya diskten tamamen kaldırılacaktır.`,
    );
    if (!confirmed) return;

    setDeletingPath(asset.path);
    setError("");
    setMessage("");
    try {
      const csrfRes = await fetch("/api/admin/csrf", { cache: "no-store" });
      if (!csrfRes.ok) throw new Error("İstek doğrulanamadı");
      const { csrfToken } = await csrfRes.json();

      const response = await fetch("/api/admin/site-assets", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ path: asset.path }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Dosya silinemedi");

      setItems((prev) => prev.filter((i) => i.path !== asset.path));
      setMessage(`"${asset.name}" VDS sunucusundan kalıcı olarak silindi.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dosya silinemedi");
    } finally {
      setDeletingPath("");
    }
  }

  function copyToClipboard(path: string) {
    void navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(""), 2500);
  }

  function formatBytes(bytes?: number) {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Filter items
  const filtered = items.filter((item) => {
    if (selectedKind !== "all" && item.kind !== selectedKind) return false;
    if (selectedFolder !== "all") {
      if (selectedFolder === "uploads" && !item.folder.startsWith("/uploads")) return false;
      if (selectedFolder === "sponsors" && !item.path.includes("sponsor")) return false;
      if (selectedFolder === "people" && !item.path.includes("people")) return false;
      if (selectedFolder === "places" && !item.path.includes("places")) return false;
      if (selectedFolder === "games" && !item.path.includes("oyun") && !item.path.includes("games")) return false;
      if (selectedFolder === "ulujam" && !item.path.includes("ulujam")) return false;
      if (selectedFolder === "fanzin" && !item.path.includes("fanzin")) return false;
    }
    if (query.trim()) {
      const q = query.toLocaleLowerCase("tr");
      return (
        item.name.toLocaleLowerCase("tr").includes(q) ||
        item.path.toLocaleLowerCase("tr").includes(q)
      );
    }
    return true;
  });

  const totalBytes = items.reduce((sum, item) => sum + (item.size || 0), 0);
  const uploadsCount = items.filter((i) => i.folder.startsWith("/uploads")).length;

  return (
    <div className={styles.managerContainer}>
      {/* Top Stat Bar */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <span className={styles.statTitle}>Toplam Medya Dosyası</span>
          <span className={styles.statValue}>{items.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statTitle}>Yüklenen Medyalar (/uploads)</span>
          <span className={styles.statValue}>{uploadsCount}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statTitle}>Toplam Disk Alanı</span>
          <span className={styles.statValue}>{formatBytes(totalBytes)}</span>
        </div>
      </div>

      {/* Global Upload Zone */}
      <div className={styles.uploadZone}>
        <h3 style={{ margin: 0, fontSize: "18px", color: "var(--color-fff2b7, #fff9cb)" }}>
          Cihazdan Yeni Dosya Yükle
        </h3>
        <p style={{ margin: 0, color: "#8c829c", fontSize: "13px" }}>
          Görseller (PNG, JPG, WebP, SVG, AVIF, GIF), videolar (MP4, WebM) ve PDF belgeleri doğrudan sunucuya yüklenir.
        </p>

        <div className={styles.uploadInputWrapper}>
          <label style={{ fontSize: "13px", color: "#d0bed8", display: "flex", alignItems: "center", gap: 6 }}>
            <span>Hedef Klasör:</span>
            <select
              value={uploadScope}
              onChange={(e) => setUploadScope(e.target.value as SiteAssetScope)}
              className={styles.scopeSelect}
            >
              <option value="general">Genel (/uploads/general)</option>
              <option value="sponsors">Sponsorlar (/uploads/sponsors)</option>
              <option value="people">Hakkımızda & Kişiler (/uploads/people)</option>
              <option value="places">Mekanlar (/uploads/places)</option>
              <option value="games">Oyunlar (/uploads/games)</option>
              <option value="ulujam">UluJam (/uploads/ulujam)</option>
              <option value="fanzin">Fanzin (/uploads/fanzin)</option>
              <option value="events">Etkinlikler (/uploads/events)</option>
              <option value="homepage">Ana Sayfa (/uploads/homepage)</option>
            </select>
          </label>

          <label className={styles.deviceUploadBtn}>
            <input
              ref={fileInputRef}
              type="file"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f);
              }}
            />
            <span>{uploading ? "Dosya yükleniyor…" : "⬆ Bilgisayardan Dosya Seç"}</span>
          </label>
        </div>

        {error && <p style={{ color: "#ff8899", margin: "4px 0", fontSize: "13px" }}>{error}</p>}
        {message && <p style={{ color: "#fff1bc", margin: "4px 0", fontSize: "13px" }}>{message}</p>}
      </div>

      {/* Filter & Search Bar */}
      <div className={styles.filterSection}>
        <div className={styles.filterRow}>
          <input
            type="search"
            placeholder="Medyalarda ara (isim veya klasör)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
          />
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className={styles.filterPill}
            style={{ color: "#fff9cb", borderColor: "rgba(237, 178, 228, 0.4)" }}
          >
            {loading ? "Yenileniyor…" : "↻ Yenile"}
          </button>
        </div>

        {/* Scope / Folder Pills */}
        <div className={styles.pillsRow}>
          {[
            { id: "all", label: "Tüm Klasörler" },
            { id: "uploads", label: "Yüklemeler (/uploads)" },
            { id: "sponsors", label: "Sponsorlar" },
            { id: "people", label: "Kişiler & Ekip" },
            { id: "places", label: "Mekanlar" },
            { id: "games", label: "Oyunlar" },
            { id: "ulujam", label: "UluJam" },
            { id: "fanzin", label: "Fanzin" },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              className={`${styles.filterPill} ${selectedFolder === pill.id ? styles.filterPillActive : ""}`}
              onClick={() => setSelectedFolder(pill.id)}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Kind Pills */}
        <div className={styles.pillsRow}>
          {[
            { id: "all", label: "Tüm Türler" },
            { id: "image", label: "Görseller" },
            { id: "video", label: "Videolar" },
            { id: "document", label: "PDF Belgeleri" },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              className={`${styles.filterPill} ${selectedKind === pill.id ? styles.filterPillActive : ""}`}
              onClick={() => setSelectedKind(pill.id as "all" | SiteAssetKind)}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Media Cards Grid */}
      {loading ? (
        <div className={styles.emptyState}>Sunucudaki medya dosyaları taranıyor…</div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>Aradığınız kriterlere uygun medya bulunamadı.</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((asset) => {
            const isDeleting = deletingPath === asset.path;
            const isCopied = copiedPath === asset.path;

            return (
              <div key={asset.path} className={styles.card}>
                <div className={styles.thumbContainer}>
                  <span className={styles.kindBadge}>
                    {asset.kind === "image" ? "Görsel" : asset.kind === "video" ? "Video" : "PDF"}
                  </span>

                  {asset.kind === "image" ? (
                    <Image
                      src={asset.path}
                      alt={asset.name}
                      fill
                      loading="lazy"
                      style={{ objectFit: "contain" }}
                      unoptimized
                    />
                  ) : asset.kind === "video" ? (
                    <div style={{ color: "#fff9cb", fontSize: "16px", fontWeight: 700 }}>
                      ▶ Video
                    </div>
                  ) : (
                    <div style={{ color: "#edb2e4", fontSize: "16px", fontWeight: 700 }}>
                      📄 PDF Belgesi
                    </div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <strong className={styles.fileName} title={asset.name}>
                    {asset.name}
                  </strong>
                  <span className={styles.filePath} title={asset.path}>
                    {asset.path}
                  </span>
                  <div className={styles.fileMeta}>
                    <span>{asset.folder.split("/").slice(2).join("/") || asset.folder}</span>
                    <span>{formatBytes(asset.size)}</span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(asset.path)}
                    className={styles.actionBtn}
                  >
                    {isCopied ? "✓ Kopyalandı" : "Yolu Kopyala"}
                  </button>
                  <a
                    href={asset.path}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.actionBtn}
                  >
                    Görüntüle ↗
                  </a>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => void handleDelete(asset)}
                    className={styles.deleteActionBtn}
                    title="VDS Sunucusundan Kalıcı Olarak Sil"
                  >
                    {isDeleting ? "…" : "Sil"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
