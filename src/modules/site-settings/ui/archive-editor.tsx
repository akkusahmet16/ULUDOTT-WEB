"use client";
import { useState } from "react";
import type { Archive, ArchiveFields, ArchiveGame } from "../domain/archives";
import type { SiteGame } from "../../games/domain/site-games";
import { UlujamArchive } from "../../events/ui/ulujam-archive";
import { SiteAssetPicker } from "../../media/ui/site-asset-picker";
import { sanitizeMediaSrc } from "../../media/domain/sanitize-src";
import { formRequest } from "../../forms/ui/admin-fetch";
import styles from "../../admin/ui/content-workspace.module.css";
const blank = (year: number): ArchiveFields => ({
  year,
  description: "",
  position: 0,
  published: false,
  gallery: [],
  games: [],
});
export function ArchiveEditor({
  initial,
  gameOptions,
}: {
  initial: Archive[];
  gameOptions: SiteGame[];
}) {
  const [items, setItems] = useState(initial),
    [data, setData] = useState<ArchiveFields>(
      blank(Math.max(2026, ...initial.map((archive) => archive.year)) + 1),
    ),
    [selected, setSelected] = useState<number | null>(null),
    [revision, setRevision] = useState(0),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const change = <K extends keyof ArchiveFields>(
    key: K,
    value: ArchiveFields[K],
  ) => setData((current) => ({ ...current, [key]: value }));
  const game = (index: number, update: Partial<ArchiveGame>) => {
    const safeUpdate = { ...update };
    if (typeof safeUpdate.image === "string") {
      safeUpdate.image = sanitizeMediaSrc(safeUpdate.image);
    }
    change(
      "games",
      data.games.map((item, i) =>
        i === index ? { ...item, ...safeUpdate } : item,
      ),
    );
  };
  function select(archive: Archive | null) {
    setSelected(archive?.year ?? null);
    setRevision(archive?.revision ?? 0);
    setMessage("");
    setData(
      archive
        ? {
            year: archive.year,
            description: archive.description,
            position: archive.position,
            published: archive.published,
            gallery: (archive.gallery || []).map((img) => ({
              ...img,
              src: sanitizeMediaSrc(img.src),
            })),
            games: (archive.games || []).map((g) => ({
              ...g,
              image: sanitizeMediaSrc(g.image),
            })),
          }
        : blank(Math.max(2026, ...items.map((item) => item.year)) + 1),
    );
  }
  async function refresh() {
    const response = await fetch("/api/admin/ulujam-archives", {
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) throw Error(result.error);
    setItems(result.items);
  }
  async function handleSave(intent: "save" | "draft" | "publish") {
    setBusy(true);
    setMessage("");
    const published =
      intent === "publish" ? true : intent === "draft" ? false : data.published;
    try {
      const sanitizedData: ArchiveFields = {
        ...data,
        published,
        gallery: data.gallery
          .filter((img) => img.src && img.src.trim() !== "")
          .map((img) => ({
            ...img,
            src: sanitizeMediaSrc(img.src),
          })),
        games: data.games
          .filter(
            (g) =>
              g.title.trim() !== "" ||
              g.image.trim() !== "" ||
              g.itchUrl.trim() !== "",
          )
          .map((g) => ({
            ...g,
            image: sanitizeMediaSrc(g.image),
          })),
      };
      const result: Archive = await formRequest("/api/admin/ulujam-archives", {
        input: sanitizedData,
        expectedRevision: revision,
      });
      select(result);
      await refresh();
      setMessage(
        published
          ? "Arşiv kaydedildi ve UluJam sayfasında yayımlandı."
          : "Arşiv taslak olarak kaydedildi. Sitede görünmez.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Arşiv kaydedilemedi",
      );
    } finally {
      setBusy(false);
    }
  }
  function movePhoto(index: number, delta: number) {
    const gallery = [...data.gallery];
    [gallery[index], gallery[index + delta]] = [
      gallery[index + delta],
      gallery[index],
    ];
    change("gallery", gallery);
  }
  return (
    <section className={styles.workspace} aria-label="UluJam arşiv düzenleyici">
      <p role="status" className={styles.status}>
        {message}
      </p>
      <div className={styles.toolbar}>
        <button type="button" disabled={busy} onClick={() => select(null)}>
          Yeni arşiv ekle
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void refresh().catch((error) => setMessage(error.message))
          }
        >
          Listeyi yenile
        </button>
      </div>
      <div className="grid">
        {items.map((archive) => (
          <article key={archive.year} className={styles.card}>
            <h2>UluJam {archive.year}</h2>
            <p>
              {archive.published ? "Yayında" : "Taslak"} ·{" "}
              {archive.gallery.length} fotoğraf
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => select(archive)}
            >
              UluJam {archive.year} düzenle
            </button>
          </article>
        ))}
      </div>
      <form
        noValidate
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave(data.published && selected ? "save" : "draft");
        }}
        aria-label="Arşiv bilgileri"
      >
        <section className={styles.card}>
          <h2>
            {selected ? `UluJam ${selected} arşivi` : "Yeni UluJam arşivi"}
          </h2>
          <div className={styles.row}>
            <label className="field">
              Arşiv yılı
              <input
                type="number"
                value={data.year}
                readOnly={selected !== null}
                min={2000}
                max={2200}
                onChange={(event) => change("year", Number(event.target.value))}
                required
              />
            </label>
            <label className="field">
              Arşiv sırası
              <input
                type="number"
                value={data.position}
                min={0}
                max={10000}
                onChange={(event) =>
                  change("position", Number(event.target.value))
                }
                required
              />
              <small>Küçük sayı önce gösterilir.</small>
            </label>
          </div>
          <label className="field">
            Arşiv açıklaması
            <textarea
              value={data.description}
              maxLength={3000}
              onChange={(event) => change("description", event.target.value)}
            />
          </label>
        </section>
        <section className={styles.card} aria-label="Arşiv fotoğrafları">
          <h2>Galeri</h2>
          <p>
            İlk fotoğraf büyük gösterilir; diğerleri mevcut arşiv düzenini
            izler.
          </p>
          {data.gallery.map((image, index) => (
            <fieldset key={index} className={styles.card}>
              <legend>{index + 1}. fotoğraf</legend>
              <SiteAssetPicker
                scope="ulujam"
                label={`${index + 1}. arşiv fotoğrafı`}
                value={image.src}
                onChange={(src) =>
                  change(
                    "gallery",
                    data.gallery.map((item, i) =>
                      i === index ? { ...item, src } : item,
                    ),
                  )
                }
                disabled={busy}
              />
              <label className="field">
                Fotoğraf açıklaması
                <input
                  value={image.alt}
                  maxLength={250}
                  required
                  onChange={(event) =>
                    change(
                      "gallery",
                      data.gallery.map((item, i) =>
                        i === index
                          ? { ...item, alt: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </label>
              <div className={styles.toolbar}>
                <button
                  type="button"
                  disabled={busy || index === 0}
                  onClick={() => movePhoto(index, -1)}
                >
                  Yukarı
                </button>
                <button
                  type="button"
                  disabled={busy || index === data.gallery.length - 1}
                  onClick={() => movePhoto(index, 1)}
                >
                  Aşağı
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    change(
                      "gallery",
                      data.gallery.filter((_, i) => i !== index),
                    )
                  }
                >
                  Fotoğrafı kaldır
                </button>
              </div>
            </fieldset>
          ))}
          <button
            type="button"
            disabled={busy || data.gallery.length >= 50}
            onClick={() =>
              change("gallery", [...data.gallery, { src: "", alt: "" }])
            }
          >
            Fotoğraf ekle
          </button>
        </section>
        <section className={styles.card} aria-label="Arşiv derece oyunları">
          <h2>İlk üç oyun</h2>
          {data.games.map((item, index) => (
            <fieldset key={index} className={styles.card}>
              <legend>{index + 1}. oyun</legend>
              <label className="field">
                Kayıtlı oyundan doldur
                <select
                  aria-label="Kayıtlı oyundan doldur"
                  value=""
                  onChange={(event) => {
                    const saved = gameOptions.find(
                      (entry) => entry.id === event.target.value,
                    );
                    if (saved)
                      game(index, {
                        title: saved.title,
                        team: saved.credit,
                        image: saved.image,
                        itchUrl: saved.href,
                        description: saved.description,
                      });
                  }}
                >
                  <option value="">İsteğe bağlı oyun seçimi</option>
                  {gameOptions.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.row}>
                <label className="field">
                  Derece
                  <select
                    aria-label="Derece"
                    value={item.rank}
                    onChange={(event) =>
                      game(index, { rank: Number(event.target.value) })
                    }
                  >
                    {[1, 2, 3].map((rank) => (
                      <option key={rank} value={rank}>
                        {rank}. derece
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Oyun adı
                  <input
                    value={item.title}
                    required
                    maxLength={200}
                    onChange={(event) =>
                      game(index, { title: event.target.value })
                    }
                  />
                </label>
              </div>
              <label className="field">
                Ekip / yapımcı bilgisi
                <input
                  value={item.team}
                  maxLength={300}
                  onChange={(event) =>
                    game(index, { team: event.target.value })
                  }
                />
              </label>
              <label className="field">
                itch.io oyun bağlantısı (isteğe bağlı)
                <input
                  type="url"
                  value={item.itchUrl}
                  maxLength={500}
                  placeholder="https://yazar.itch.io/oyun-adi"
                  onChange={(event) =>
                    game(index, { itchUrl: event.target.value })
                  }
                />
              </label>
              <label className="field">
                Oyun açıklaması
                <textarea
                  value={item.description}
                  maxLength={2000}
                  onChange={(event) =>
                    game(index, { description: event.target.value })
                  }
                />
              </label>
              <SiteAssetPicker
                scope="games"
                label="Derece oyunu kapağı"
                value={item.image}
                onChange={(image) => game(index, { image })}
                disabled={busy}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  change(
                    "games",
                    data.games.filter((_, i) => i !== index),
                  )
                }
              >
                Oyunu arşivden kaldır
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            disabled={busy || data.games.length >= 3}
            onClick={() =>
              change("games", [
                ...data.games,
                {
                  rank:
                    [1, 2, 3].find(
                      (rank) =>
                        !data.games.some((entry) => entry.rank === rank),
                    ) ?? 1,
                  title: "",
                  team: "",
                  description: "",
                  image: "",
                  itchUrl: "",
                },
              ])
            }
          >
            Derece oyunu ekle
          </button>
        </section>
        <div className={styles.actions}>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSave(data.published && selected ? "save" : "draft")}
          >
            {busy
              ? "Kaydediliyor…"
              : data.published && selected
                ? "Değişiklikleri kaydet"
                : "Taslağı kaydet"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSave(data.published && selected ? "draft" : "publish")}
          >
            {data.published && selected ? "Yayından kaldır" : "Yayımla"}
          </button>
        </div>
      </form>
      <details className={styles.card}>
        <summary>Arşiv önizlemesi</summary>
        <UlujamArchive
          archive={{
            ...data,
            gallery: data.gallery
              .filter((image) => image.src)
              .map((img) => ({ ...img, src: sanitizeMediaSrc(img.src) })),
            games: data.games
              .filter((game) => game.image && game.title)
              .map((g) => ({ ...g, image: sanitizeMediaSrc(g.image) })),
          }}
        />
      </details>
    </section>
  );
}
