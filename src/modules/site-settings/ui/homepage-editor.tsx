"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { formRequest } from "../../forms/ui/admin-fetch";
import type { HomepageSettings } from "../domain/homepage";
import styles from "./admin-editors.module.css";

export function HomepageEditor() {
  const [data, setData] = useState<HomepageSettings | null>(null);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"story" | "world">("story");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/homepage-settings");
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
          setRevision(json.revision);
        }
      } catch (err) {
        console.error("Failed to load homepage settings:", err);
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
      const res = await formRequest<{ data: HomepageSettings; revision: number }>(
        "/api/admin/homepage-settings",
        {
          input: data,
          expectedRevision: revision,
        },
      );
      setData(res.data);
      setRevision(res.revision);
      setStatusMessage("Değişiklikler başarıyla kaydedildi ve ana sayfada yayına alındı.");
    } catch (err: unknown) {
      setStatusMessage("Hata: " + ((err instanceof Error ? err.message : "Hata") || "Kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className={styles.loadingState}>Yükleniyor...</div>;
  }

  if (!data) {
    return <div className={styles.errorState}>Veriler yüklenemedi.</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>ANA SAYFA DÜZENİ</span>
          <h1 className={styles.title}>ANA SAYFA BÖLÜMLERİ</h1>
          <p className={styles.subtitle}>
            İkili Kolon (Story Panels) ve Topluluğun Dünyası bölümlerini düzenleyin.
          </p>
        </div>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "story" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("story")}
          >
            01 İkili Kolon (Story Panels)
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "world" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("world")}
          >
            02 Topluluğun Dünyası (People & Places)
          </button>
        </div>
      </header>

      {statusMessage && (
        <div className={statusMessage.startsWith("Hata") ? styles.alertError : styles.alertSuccess}>
          {statusMessage}
        </div>
      )}

      <form onSubmit={handleSave} className={styles.formGrid}>
        {activeTab === "story" && (
          <div className={styles.splitGrid}>
            {/* Sol Kolon - UluJam Paneli */}
            <div className={styles.panelBox}>
              <div className={styles.panelHeader}>
                <span className={styles.panelNumber}>01</span>
                <h3>SOL KOLON — ULUJAM PANELİ</h3>
              </div>
              
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Kapak Görseli Yolu (9:16)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={data.storyPanels.leftImage}
                  onChange={(e) =>
                    setData({
                      ...data,
                      storyPanels: { ...data.storyPanels, leftImage: e.target.value },
                    })
                  }
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Üst Etiket (Eyebrow)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={data.storyPanels.leftEyebrow}
                  onChange={(e) =>
                    setData({
                      ...data,
                      storyPanels: { ...data.storyPanels, leftEyebrow: e.target.value },
                    })
                  }
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Panel Başlığı</label>
                <input
                  type="text"
                  className={styles.input}
                  value={data.storyPanels.leftTitle}
                  onChange={(e) =>
                    setData({
                      ...data,
                      storyPanels: { ...data.storyPanels, leftTitle: e.target.value },
                    })
                  }
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Kısa Açıklama</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={data.storyPanels.leftDescription}
                  onChange={(e) =>
                    setData({
                      ...data,
                      storyPanels: { ...data.storyPanels, leftDescription: e.target.value },
                    })
                  }
                />
              </div>

              <div className={styles.previewCard}>
                <span className={styles.previewTag}>CANLI ÖNİZLEME</span>
                <div className={styles.storyCardMock}>
                  <div className={styles.storyCardMedia}>
                    <Image
                      src={data.storyPanels.leftImage || "/community/01-anasayfa/anasayfa-ulujam-panel.webp"}
                      alt=""
                      width={300}
                      height={450}
                      unoptimized
                    />
                  </div>
                  <div className={styles.storyCardOverlay}>
                    <span className={styles.storyCardEyebrow}>{data.storyPanels.leftEyebrow || "ULUJAM"}</span>
                    <strong>{data.storyPanels.leftTitle}</strong>
                    <p>{data.storyPanels.leftDescription}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sağ Kolon - Derece Oyunları Paneli */}
            <div className={styles.panelBox}>
              <div className={styles.panelHeader}>
                <span className={styles.panelNumber}>02</span>
                <h3>SAĞ KOLON — OYUNLAR PANELİ</h3>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Kapak Görseli Yolu (9:16)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={data.storyPanels.rightImage}
                  onChange={(e) =>
                    setData({
                      ...data,
                      storyPanels: { ...data.storyPanels, rightImage: e.target.value },
                    })
                  }
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Panel Başlığı</label>
                <input
                  type="text"
                  className={styles.input}
                  value={data.storyPanels.rightTitle}
                  onChange={(e) =>
                    setData({
                      ...data,
                      storyPanels: { ...data.storyPanels, rightTitle: e.target.value },
                    })
                  }
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Kısa Açıklama</label>
                <textarea
                  className={styles.textarea}
                  rows={2}
                  value={data.storyPanels.rightDescription}
                  onChange={(e) =>
                    setData({
                      ...data,
                      storyPanels: { ...data.storyPanels, rightDescription: e.target.value },
                    })
                  }
                />
              </div>

              {/* Mod Seçimi: UluJam Yılı vs Bizim Yaptıklarımız */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Oyun Gösterim Modu</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="gamesMode"
                      checked={data.storyPanels.gamesMode === "ulujam_year"}
                      onChange={() =>
                        setData({
                          ...data,
                          storyPanels: { ...data.storyPanels, gamesMode: "ulujam_year" },
                        })
                      }
                    />
                    <span>UluJam Derece Oyunları (Otomatik Yıl Geçişi)</span>
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="gamesMode"
                      checked={data.storyPanels.gamesMode === "custom_games"}
                      onChange={() =>
                        setData({
                          ...data,
                          storyPanels: { ...data.storyPanels, gamesMode: "custom_games" },
                        })
                      }
                    />
                    <span>Bizim Yaptıklarımız (Departman & Topluluk Oyunları)</span>
                  </label>
                </div>
              </div>

              {data.storyPanels.gamesMode === "ulujam_year" ? (
                <div className={styles.subBox}>
                  <label className={styles.label}>Aktif UluJam Edisyonu Yılı</label>
                  <select
                    className={styles.select}
                    value={data.storyPanels.activeUlujamYear}
                    onChange={(e) =>
                      setData({
                        ...data,
                        storyPanels: {
                          ...data.storyPanels,
                          activeUlujamYear: parseInt(e.target.value, 10),
                        },
                      })
                    }
                  >
                    <option value={2026}>UluJam 2026 (Doğrulanmış Dereceler)</option>
                    <option value={2027}>UluJam 2027 (Yeni Edisyon)</option>
                  </select>
                  <p className={styles.helpText}>
                    Seçilen yıla göre ana sayfadaki başlık ("UluJam {data.storyPanels.activeUlujamYear}'nin doğrulanmış derece bağlantıları.") ve oyun dereceleri otomatik olarak güncellenir.
                  </p>
                </div>
              ) : (
                <div className={styles.subBox}>
                  <div className={styles.rowBetween}>
                    <label className={styles.label}>Elle Tanımlanan Oyunlar (Maks. 3)</label>
                    {data.storyPanels.customGames.length < 3 && (
                      <button
                        type="button"
                        className={styles.smallAddBtn}
                        onClick={() =>
                          setData({
                            ...data,
                            storyPanels: {
                              ...data.storyPanels,
                              customGames: [
                                ...data.storyPanels.customGames,
                                {
                                  id: "game-" + Date.now(),
                                  title: "Yeni Oyun",
                                  team: "Oyun Geliştirme Ekibi",
                                  image: "/community/06-oyunlar/yayimlanan/no-time-to-die.webp",
                                  description: "",
                                  itchUrl: "https://itch.io",
                                },
                              ],
                            },
                          })
                        }
                      >
                        + Oyun Ekle
                      </button>
                    )}
                  </div>
                  {data.storyPanels.customGames.map((game, idx) => (
                    <div key={game.id} className={styles.customGameItem}>
                      <div className={styles.fieldRow}>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="Oyun Adı"
                          value={game.title}
                          onChange={(e) => {
                            const updated = [...data.storyPanels.customGames];
                            updated[idx].title = e.target.value;
                            setData({
                              ...data,
                              storyPanels: { ...data.storyPanels, customGames: updated },
                            });
                          }}
                        />
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => {
                            const updated = data.storyPanels.customGames.filter((_, i) => i !== idx);
                            setData({
                              ...data,
                              storyPanels: { ...data.storyPanels, customGames: updated },
                            });
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Ekip / Departman Adı"
                        value={game.team}
                        onChange={(e) => {
                          const updated = [...data.storyPanels.customGames];
                          updated[idx].team = e.target.value;
                          setData({
                            ...data,
                            storyPanels: { ...data.storyPanels, customGames: updated },
                          });
                        }}
                      />
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Görsel Yolu (/community/...)"
                        value={game.image}
                        onChange={(e) => {
                          const updated = [...data.storyPanels.customGames];
                          updated[idx].image = e.target.value;
                          setData({
                            ...data,
                            storyPanels: { ...data.storyPanels, customGames: updated },
                          });
                        }}
                      />
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Itch.io veya İndirme Bağlantısı"
                        value={game.itchUrl}
                        onChange={(e) => {
                          const updated = [...data.storyPanels.customGames];
                          updated[idx].itchUrl = e.target.value;
                          setData({
                            ...data,
                            storyPanels: { ...data.storyPanels, customGames: updated },
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "world" && (
          <div className={styles.panelBox}>
            <div className={styles.panelHeader}>
              <span className={styles.panelNumber}>02</span>
              <h3>TOPLULUĞUN DÜNYASI (PEOPLE & PLACES VİTRİNİ)</h3>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Arka Plan Görseli</label>
              <input
                type="text"
                className={styles.input}
                value={data.communityWorld.image}
                onChange={(e) =>
                  setData({
                    ...data,
                    communityWorld: { ...data.communityWorld, image: e.target.value },
                  })
                }
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Üst Etiket (Eyebrow)</label>
              <input
                type="text"
                className={styles.input}
                value={data.communityWorld.eyebrow}
                onChange={(e) =>
                  setData({
                    ...data,
                    communityWorld: { ...data.communityWorld, eyebrow: e.target.value },
                  })
                }
              />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Ana Başlık Satır 1</label>
                <input
                  type="text"
                  className={styles.input}
                  value={data.communityWorld.headingLine1}
                  onChange={(e) =>
                    setData({
                      ...data,
                      communityWorld: { ...data.communityWorld, headingLine1: e.target.value },
                    })
                  }
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Vurgulu Başlık Satır 2 (Highlight)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={data.communityWorld.headingHighlight}
                  onChange={(e) =>
                    setData({
                      ...data,
                      communityWorld: { ...data.communityWorld, headingHighlight: e.target.value },
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Açıklama Paragrafı</label>
              <textarea
                className={styles.textarea}
                rows={3}
                value={data.communityWorld.copy}
                onChange={(e) =>
                  setData({
                    ...data,
                    communityWorld: { ...data.communityWorld, copy: e.target.value },
                  })
                }
              />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>1. Buton Metni & URL</label>
                <div className={styles.fieldRow}>
                  <input
                    type="text"
                    className={styles.input}
                    value={data.communityWorld.boardButtonText}
                    onChange={(e) =>
                      setData({
                        ...data,
                        communityWorld: { ...data.communityWorld, boardButtonText: e.target.value },
                      })
                    }
                  />
                  <input
                    type="text"
                    className={styles.input}
                    value={data.communityWorld.boardButtonUrl}
                    onChange={(e) =>
                      setData({
                        ...data,
                        communityWorld: { ...data.communityWorld, boardButtonUrl: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>2. Buton Metni & URL</label>
                <div className={styles.fieldRow}>
                  <input
                    type="text"
                    className={styles.input}
                    value={data.communityWorld.placesButtonText}
                    onChange={(e) =>
                      setData({
                        ...data,
                        communityWorld: { ...data.communityWorld, placesButtonText: e.target.value },
                      })
                    }
                  />
                  <input
                    type="text"
                    className={styles.input}
                    value={data.communityWorld.placesButtonUrl}
                    onChange={(e) =>
                      setData({
                        ...data,
                        communityWorld: { ...data.communityWorld, placesButtonUrl: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={styles.formFooter}>
          <button type="submit" disabled={saving} className={styles.primaryBtn}>
            {saving ? "KAYDEDİLİYOR..." : "DEĞİŞİKLİKLERİ YAYINLA"}
          </button>
        </div>
      </form>
    </div>
  );
}
