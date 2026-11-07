"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { formRequest } from "../../forms/ui/admin-fetch";
import { SiteAssetPicker } from "../../media/ui/site-asset-picker";
import type { HomepageSettings } from "../domain/homepage";
import type { Archive } from "../domain/archives";
import styles from "./admin-editors.module.css";

export function HomepageEditor() {
  const [data, setData] = useState<HomepageSettings | null>(null);
  const [archives, setArchives] = useState<Archive[]>([]);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"story" | "world">("story");

  useEffect(() => {
    async function load() {
      try {
        const [resHome, resArch] = await Promise.all([
          fetch("/api/admin/homepage-settings"),
          fetch("/api/admin/ulujam-archives"),
        ]);
        if (resHome.ok) {
          const json = await resHome.json();
          setData(json.data);
          setRevision(json.revision);
        }
        if (resArch.ok) {
          const jsonArch = await resArch.json();
          if (Array.isArray(jsonArch.items)) {
            setArchives(jsonArch.items);
          }
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

  const availableYears = Array.from(
    new Set([
      ...archives.map((a) => a.year),
      2026,
      data.storyPanels.activeUlujamYear,
    ]),
  ).sort((a, b) => b - a);

  const selectedArchive = archives.find(
    (a) => a.year === data.storyPanels.activeUlujamYear,
  );

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
              
              <div style={{ margin: "10px 0" }}>
                <SiteAssetPicker
                  scope="homepage"
                  kind="image"
                  label="Sol Kolon Kapak Görseli (9:16)"
                  value={data.storyPanels.leftImage}
                  onChange={(path) =>
                    setData({
                      ...data,
                      storyPanels: { ...data.storyPanels, leftImage: path },
                    })
                  }
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

              {/* Sol Kolon - Açılır Pencere (Modal) ve Vlog Ayarları */}
              <div className={styles.subBox}>
                <div className={styles.panelSubHeader}>
                  <h4>AÇILIR PENCERE (MODAL & VLOG) AYARLARI</h4>
                  <p className={styles.helpText}>
                    Ziyaretçi ana sayfada UluJam kolonuna tıkladığında açılan penceredeki video, kapak ve detay metinleri.
                  </p>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>YouTube Video Bağlantısı veya ID</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="https://youtu.be/... veya video ID"
                    value={data.storyPanels.ulujamVideoUrl ?? ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        storyPanels: {
                          ...data.storyPanels,
                          ulujamVideoUrl: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div style={{ margin: "4px 0" }}>
                  <SiteAssetPicker
                    scope="ulujam"
                    kind="image"
                    label="Video / Vlog Kapak Görseli (16:9)"
                    value={data.storyPanels.ulujamVideoCover ?? ""}
                    onChange={(path) =>
                      setData({
                        ...data,
                        storyPanels: {
                          ...data.storyPanels,
                          ulujamVideoCover: path,
                        },
                      })
                    }
                  />
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Açılır Pencere Başlığı</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={data.storyPanels.ulujamModalTitle ?? ""}
                      onChange={(e) =>
                        setData({
                          ...data,
                          storyPanels: {
                            ...data.storyPanels,
                            ulujamModalTitle: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Açılır Pencere Üst Etiketi (Eyebrow)</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={data.storyPanels.ulujamModalEyebrow ?? ""}
                      onChange={(e) =>
                        setData({
                          ...data,
                          storyPanels: {
                            ...data.storyPanels,
                            ulujamModalEyebrow: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Video Başlığı (Vlog Adı)</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={data.storyPanels.ulujamVideoTitle ?? ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        storyPanels: {
                          ...data.storyPanels,
                          ulujamVideoTitle: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Açılır Pencere Açıklaması</label>
                  <textarea
                    className={styles.textarea}
                    rows={3}
                    value={data.storyPanels.ulujamModalDescription ?? ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        storyPanels: {
                          ...data.storyPanels,
                          ulujamModalDescription: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Sağ Kolon - Derece Oyunları Paneli */}
            <div className={styles.panelBox}>
              <div className={styles.panelHeader}>
                <span className={styles.panelNumber}>02</span>
                <h3>SAĞ KOLON — OYUNLAR PANELİ</h3>
              </div>

              <div style={{ margin: "10px 0" }}>
                <SiteAssetPicker
                  scope="homepage"
                  kind="image"
                  label="Sağ Kolon Kapak Görseli (9:16)"
                  value={data.storyPanels.rightImage}
                  onChange={(path) =>
                    setData({
                      ...data,
                      storyPanels: { ...data.storyPanels, rightImage: path },
                    })
                  }
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
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        UluJam {yr} {yr === 2026 ? "(Doğrulanmış Dereceler)" : ""}
                      </option>
                    ))}
                  </select>
                  <p className={styles.helpText}>
                    Seçilen yıla göre ana sayfadaki başlık ("UluJam {data.storyPanels.activeUlujamYear}'nin doğrulanmış derece bağlantıları.") ve oyun dereceleri otomatik olarak güncellenir.
                  </p>

                  {/* Seçilen Edisyona Ait Otomatik Gelen Derece Oyunları Önizlemesi */}
                  {selectedArchive && selectedArchive.games && selectedArchive.games.length > 0 ? (
                    <div className={styles.autoGamesList}>
                      <p className={styles.autoGamesNotice}>
                        ✓ <strong>UluJam {selectedArchive.year}</strong> edisyonuna ait {selectedArchive.games.length} derece oyunu ana sayfada otomatik gösterilecek:
                      </p>
                      <div className={styles.gamesGridSmall}>
                        {selectedArchive.games.map((g) => (
                          <div key={g.rank} className={styles.gamePreviewItem}>
                            <span className={styles.gameRankBadge}>{g.rank}. Derece</span>
                            {g.image && (
                              <div className={styles.gameThumbMini}>
                                <Image src={g.image} alt="" width={70} height={44} unoptimized />
                              </div>
                            )}
                            <div className={styles.gamePreviewMeta}>
                              <strong>{g.title || "Adsız Oyun"}</strong>
                              {g.team && <span>{g.team}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.autoGamesEmpty}>
                      <p>
                        UluJam {data.storyPanels.activeUlujamYear} için arşivde henüz kayıtlı derece oyunu bulunmuyor.
                        <br />
                        <a href="/admin/ulujam-arsivleri" target="_blank" rel="noopener noreferrer">
                          UluJam Arşivleri sayfasına giderek bu yıla oyun ekleyebilirsiniz ↗
                        </a>
                      </p>
                    </div>
                  )}
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
                      <div style={{ margin: "6px 0" }}>
                        <SiteAssetPicker
                          scope="games"
                          kind="image"
                          label={`${game.title || "Oyun"} Görseli`}
                          value={game.image}
                          onChange={(path) => {
                            const updated = [...data.storyPanels.customGames];
                            updated[idx].image = path;
                            setData({
                              ...data,
                              storyPanels: { ...data.storyPanels, customGames: updated },
                            });
                          }}
                        />
                      </div>
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

              {/* Sağ Kolon - Açılır Pencere (Modal) Ayarları */}
              <div className={styles.subBox}>
                <div className={styles.panelSubHeader}>
                  <h4>AÇILIR PENCERE (MODAL) AYARLARI</h4>
                  <p className={styles.helpText}>
                    Ziyaretçi ana sayfada Derece Oyunları kolonuna tıkladığında açılan pencerenin üst kapak görseli ve metinleri.
                  </p>
                </div>

                <div style={{ margin: "4px 0" }}>
                  <SiteAssetPicker
                    scope="games"
                    kind="image"
                    label="Açılır Pencere Üst Kapak Görseli (16:9)"
                    value={data.storyPanels.gamesDialogCover ?? ""}
                    onChange={(path) =>
                      setData({
                        ...data,
                        storyPanels: {
                          ...data.storyPanels,
                          gamesDialogCover: path,
                        },
                      })
                    }
                  />
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Açılır Pencere Başlığı</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={data.storyPanels.gamesDialogTitle ?? ""}
                      onChange={(e) =>
                        setData({
                          ...data,
                          storyPanels: {
                            ...data.storyPanels,
                            gamesDialogTitle: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Toolbar Üst Yazısı</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={data.storyPanels.gamesDialogToolbar ?? ""}
                      onChange={(e) =>
                        setData({
                          ...data,
                          storyPanels: {
                            ...data.storyPanels,
                            gamesDialogToolbar: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Açılır Pencere Açıklaması</label>
                  <textarea
                    className={styles.textarea}
                    rows={3}
                    value={data.storyPanels.gamesDialogDescription ?? ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        storyPanels: {
                          ...data.storyPanels,
                          gamesDialogDescription: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "world" && (
          <div className={styles.panelBox}>
            <div className={styles.panelHeader}>
              <span className={styles.panelNumber}>02</span>
              <h3>TOPLULUĞUN DÜNYASI (PEOPLE & PLACES VİTRİNİ)</h3>
            </div>

            <div style={{ margin: "10px 0" }}>
              <SiteAssetPicker
                scope="homepage"
                kind="image"
                label="Arka Plan Görseli"
                value={data.communityWorld.image}
                onChange={(path) =>
                  setData({
                    ...data,
                    communityWorld: { ...data.communityWorld, image: path },
                  })
                }
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
                <label className={styles.label}>Vurgulu Başlık (Satır 1)</label>
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
              <div className={styles.fieldGroup}>
                <label className={styles.label}>İkinci Başlık (Satır 2)</label>
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
