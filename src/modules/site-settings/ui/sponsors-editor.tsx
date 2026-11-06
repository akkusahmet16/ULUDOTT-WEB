"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { formRequest } from "../../forms/ui/admin-fetch";
import { SiteAssetPicker } from "../../media/ui/site-asset-picker";
import type { SponsorsSettings, SponsorItem } from "../domain/sponsors";
import styles from "./admin-editors.module.css";

export function SponsorsEditor() {
  const [data, setData] = useState<SponsorsSettings | null>(null);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/sponsors-settings");
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
          setRevision(json.revision);
        }
      } catch (err) {
        console.error("Failed to load sponsors settings:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!data || saving) return;
    setSaving(true);
    setStatusMessage("");

    try {
      const res = await formRequest<{ data: SponsorsSettings; revision: number }>(
        "/api/admin/sponsors-settings",
        {
          input: data,
          expectedRevision: revision,
        },
      );
      setData(res.data);
      setRevision(res.revision);
      setStatusMessage("Sponsorlar başarıyla güncellendi.");
    } catch (err: unknown) {
      setStatusMessage("Hata: " + ((err instanceof Error ? err.message : "Hata") || "Kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  }

  function addSponsor() {
    if (!data) return;
    const newItem: SponsorItem = {
      id: "sponsor-" + Date.now(),
      name: "Yeni Sponsor",
      logoUrl: "/community/01-anasayfa/sponsorlar/sponsor-dijipin-logo.webp",
      websiteUrl: "https://",
      position: (data.sponsors.length + 1) * 10,
      visible: true,
    };
    setData({
      ...data,
      sponsors: [...data.sponsors, newItem],
    });
  }

  function updateSponsor(index: number, updates: Partial<SponsorItem>) {
    if (!data) return;
    const list = [...data.sponsors];
    list[index] = { ...list[index], ...updates };
    setData({ ...data, sponsors: list });
  }

  function removeSponsor(index: number) {
    if (!data) return;
    setData({
      ...data,
      sponsors: data.sponsors.filter((_, i) => i !== index),
    });
  }

  function moveSponsor(index: number, direction: "up" | "down") {
    if (!data) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= data.sponsors.length) return;
    const list = [...data.sponsors];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    // Pozisyonları güncelle
    list.forEach((item, i) => {
      item.position = (i + 1) * 10;
    });
    setData({ ...data, sponsors: list });
  }

  if (loading) return <div className={styles.loadingState}>Yükleniyor...</div>;
  if (!data) return <div className={styles.errorState}>Veriler yüklenemedi.</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>ANA SAYFA SPONSORLARI</span>
          <h1 className={styles.title}>SPONSOR YÖNETİMİ</h1>
          <p className={styles.subtitle}>
            Ana sayfanın altındaki gri sponsor şeridinde yer alan logoları, bağlantıları ve sıralamayı düzenleyin.
          </p>
        </div>
      </header>

      {statusMessage && (
        <div className={statusMessage.startsWith("Hata") ? styles.alertError : styles.alertSuccess}>
          {statusMessage}
        </div>
      )}

      <form onSubmit={handleSave} className={styles.formGrid}>
        <div className={styles.panelBox}>
          <div className={styles.rowBetween}>
            <div className={styles.fieldGroup} style={{ flex: 1, maxWidth: "400px" }}>
              <label className={styles.label}>Bölüm Üst Başlığı</label>
              <input
                type="text"
                className={styles.input}
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
              />
            </div>
            <button
              type="button"
              className={styles.smallAddBtn}
              onClick={addSponsor}
            >
              + Yeni Sponsor Ekle
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
            {data.sponsors.map((sponsor, index) => (
              <div key={sponsor.id} className={styles.customGameItem} style={{ padding: "16px" }}>
                <div className={styles.rowBetween}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--purple)" }}>
                      #{index + 1}
                    </span>
                    <strong style={{ color: "var(--cream)" }}>{sponsor.name || "İsimsiz Sponsor"}</strong>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveSponsor(index, "up")}
                      className={styles.smallAddBtn}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={index === data.sponsors.length - 1}
                      onClick={() => moveSponsor(index, "down")}
                      className={styles.smallAddBtn}
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSponsor(index)}
                      className={styles.removeBtn}
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className={styles.fieldRow} style={{ marginTop: "8px" }}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Sponsor Adı</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={sponsor.name}
                      onChange={(e) => updateSponsor(index, { name: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Web Sitesi URL</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={sponsor.websiteUrl}
                      onChange={(e) => updateSponsor(index, { websiteUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div style={{ marginTop: "10px" }}>
                  <SiteAssetPicker
                    scope="sponsors"
                    kind="image"
                    label="Sponsor Logosu (Cihazdan Yükle veya Kütüphaneden Seç)"
                    value={sponsor.logoUrl}
                    onChange={(path) => updateSponsor(index, { logoUrl: path })}
                  />
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup} style={{ maxWidth: "160px" }}>
                    <label className={styles.label}>Görünürlük</label>
                    <label className={styles.radioOption} style={{ marginTop: "10px" }}>
                      <input
                        type="checkbox"
                        checked={sponsor.visible}
                        onChange={(e) => updateSponsor(index, { visible: e.target.checked })}
                      />
                      <span>Yayında</span>
                    </label>
                  </div>
                </div>

                {/* Logo Önizleme */}
                <div style={{ marginTop: "8px", background: "var(--color-0005)", padding: "12px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ fontSize: "11px", color: "var(--admin-muted)" }}>LOGO ÖNİZLEME:</span>
                  <div style={{ maxHeight: "36px", maxWidth: "160px" }}>
                    <Image
                      src={sponsor.logoUrl || "/community/01-anasayfa/sponsorlar/sponsor-dijipin-logo.webp"}
                      alt={sponsor.name}
                      width={160}
                      height={40}
                      style={{ maxHeight: "36px", width: "auto", objectFit: "contain" }}
                      unoptimized
                    />
                  </div>
                </div>
              </div>
            ))}

            {data.sponsors.length === 0 && (
              <p style={{ color: "var(--admin-muted)", textAlign: "center", padding: "24px" }}>
                Henüz sponsor eklenmemiş. Yukarıdaki "+ Yeni Sponsor Ekle" butonuna tıklayın.
              </p>
            )}
          </div>
        </div>

        <div className={styles.formFooter}>
          <button type="submit" disabled={saving} className={styles.primaryBtn}>
            {saving ? "KAYDEDİLİYOR..." : "SPONSORLARI YAYINLA"}
          </button>
        </div>
      </form>
    </div>
  );
}
