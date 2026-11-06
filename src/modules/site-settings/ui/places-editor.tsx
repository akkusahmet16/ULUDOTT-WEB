"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { formRequest } from "../../forms/ui/admin-fetch";
import type { PlacesSettings, PlaceScene } from "../domain/places";
import styles from "./admin-editors.module.css";

export function PlacesEditor() {
  const [data, setData] = useState<PlacesSettings | null>(null);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/places-settings");
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
          setRevision(json.revision);
        }
      } catch (err) {
        console.error("Failed to load places settings:", err);
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
      const res = await formRequest<{ data: PlacesSettings; revision: number }>(
        "/api/admin/places-settings",
        {
          input: data,
          expectedRevision: revision,
        },
      );
      setData(res.data);
      setRevision(res.revision);
      setStatusMessage("Mekanlar bölümü başarıyla kaydedildi.");
    } catch (err: unknown) {
      setStatusMessage("Hata: " + ((err instanceof Error ? err.message : "Hata") || "Kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  }

  function updateScene(sceneIndex: number, updates: Partial<PlaceScene>) {
    if (!data) return;
    const list = [...data.scenes];
    list[sceneIndex] = { ...list[sceneIndex], ...updates };
    setData({ ...data, scenes: list });
  }

  function addVenueName(sceneIndex: number) {
    if (!data) return;
    const list = [...data.scenes];
    list[sceneIndex].names = [...list[sceneIndex].names, "Yeni Mekan Adı"];
    setData({ ...data, scenes: list });
  }

  function updateVenueName(sceneIndex: number, nameIndex: number, val: string) {
    if (!data) return;
    const list = [...data.scenes];
    const names = [...list[sceneIndex].names];
    names[nameIndex] = val;
    list[sceneIndex].names = names;
    setData({ ...data, scenes: list });
  }

  function removeVenueName(sceneIndex: number, nameIndex: number) {
    if (!data) return;
    const list = [...data.scenes];
    list[sceneIndex].names = list[sceneIndex].names.filter((_, i) => i !== nameIndex);
    setData({ ...data, scenes: list });
  }

  if (loading) return <div className={styles.loadingState}>Yükleniyor...</div>;
  if (!data) return <div className={styles.errorState}>Veriler yüklenemedi.</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>HAKKIMIZDA MEKANLARI</span>
          <h1 className={styles.title}>MEKANLAR & BULUŞMA ALANLARI</h1>
          <p className={styles.subtitle}>
            Hakkımızda sayfasının en altında yer alan etkinlik kafeleri ve salonların görsellerini ve isimlerini düzenleyin.
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
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Bölüm Üst Etiketi (Eyebrow)</label>
              <input
                type="text"
                className={styles.input}
                value={data.eyebrow}
                onChange={(e) => setData({ ...data, eyebrow: e.target.value })}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Ana Başlık</label>
              <input
                type="text"
                className={styles.input}
                value={data.heading}
                onChange={(e) => setData({ ...data, heading: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px", marginTop: "16px" }}>
            {data.scenes.map((scene, sIdx) => (
              <div key={scene.id} className={styles.subBox} style={{ gap: "16px" }}>
                <div className={styles.panelHeader}>
                  <span className={styles.panelNumber}>0{sIdx + 1}</span>
                  <h3>{scene.title || `Sahne 0${sIdx + 1}`}</h3>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Sahne Başlığı</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={scene.title}
                    onChange={(e) => updateScene(sIdx, { title: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Görsel Yolu</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={scene.image}
                    onChange={(e) => updateScene(sIdx, { image: e.target.value })}
                    required
                  />
                </div>

                {/* Görsel Önizleme */}
                <div style={{ position: "relative", width: "100%", height: "140px", borderRadius: "4px", overflow: "hidden" }}>
                  <Image
                    src={scene.image || "/community/03-hakkimizda/places/places-kafeler.webp"}
                    alt=""
                    fill
                    style={{ objectFit: "cover" }}
                    unoptimized
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.rowBetween}>
                    <label className={styles.label}>Mekan / Salon İsimleri</label>
                    <button
                      type="button"
                      className={styles.smallAddBtn}
                      onClick={() => addVenueName(sIdx)}
                    >
                      + İsim Ekle
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                    {scene.names.map((name, nIdx) => (
                      <div key={nIdx} className={styles.fieldRow}>
                        <input
                          type="text"
                          className={styles.input}
                          value={name}
                          onChange={(e) => updateVenueName(sIdx, nIdx, e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => removeVenueName(sIdx, nIdx)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.formFooter}>
          <button type="submit" disabled={saving} className={styles.primaryBtn}>
            {saving ? "KAYDEDİLİYOR..." : "MEKANLARI YAYINLA"}
          </button>
        </div>
      </form>
    </div>
  );
}
