"use client";
import { useState, type FormEvent } from "react";
import type { SiteGame, SiteGameFields } from "../domain/site-games";
import { SiteGameCard } from "./site-game-card";
import { SiteAssetPicker } from "../../media/ui/site-asset-picker";
import { formRequest } from "../../forms/ui/admin-fetch";
import { Dialog } from "../../../components/design-system/dialog";
import { sanitizeMediaSrc } from "../../media/domain/sanitize-src";
import styles from "../../admin/ui/content-workspace.module.css";

const empty: SiteGameFields = {
  title: "",
  label: "Yayımlanmış oyun",
  credit: "",
  description: "",
  image: "",
  alt: "",
  href: "",
  position: 100,
  published: false,
};
export function SiteGameEditor({ initial }: { initial: SiteGame[] }) {
  const [items, setItems] = useState(initial),
    [selected, setSelected] = useState<SiteGame | null>(null),
    [draft, setDraft] = useState<SiteGameFields>(empty),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [deleteError, setDeleteError] = useState("");
  const change = <K extends keyof SiteGameFields>(
    key: K,
    value: SiteGameFields[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));
  function select(game: SiteGame | null) {
    setSelected(game);
    setMessage("");
    if (game)
      setDraft({
        title: game.title,
        label: game.label,
        credit: game.credit,
        description: game.description,
        image: game.image,
        alt: game.alt,
        href: game.href,
        position: game.position,
        published: game.published,
      });
    else setDraft(empty);
  }
  async function refresh() {
    const response = await fetch("/api/admin/game-catalog", {
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) throw Error(result.error ?? "Oyunlar alınamadı");
    setItems(result.items);
  }
  async function handleSave(intent: "save" | "draft" | "publish") {
    setBusy(true);
    setMessage("");
    const published =
      intent === "publish"
        ? true
        : intent === "draft"
          ? false
          : draft.published;
    try {
      const sanitizedDraft: SiteGameFields = {
        ...draft,
        published,
        image: sanitizeMediaSrc(draft.image),
      };
      const result: SiteGame = await formRequest("/api/admin/game-catalog", {
        action: "save",
        input: sanitizedDraft,
        ...(selected
          ? { id: selected.id, expectedRevision: selected.revision }
          : {}),
      });
      select(result);
      await refresh();
      setMessage(
        published
          ? "Oyun kaydedildi ve sitede yayımlandı."
          : "Oyun kaydedildi. Taslak sitede görünmez.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Oyun kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!selected) return;
    setBusy(true);
    setMessage("");
    try {
      await formRequest("/api/admin/game-catalog", {
        action: "remove",
        id: selected.id,
        expectedRevision: selected.revision,
      });
      await refresh();
      select(null);
      setMessage("Oyun silindi ve siteden kaldırıldı.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Oyun silinemedi";
      setMessage(message);
      setDeleteError(message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={styles.workspace} aria-label="Site oyun kartları">
      <p className="eyebrow">OYUN KATALOĞU</p>
      <h2>Sitedeki oyun kartları</h2>
      <p className={styles.intro}>
        Kapak görselini klasörden seçin, bilgileri girin ve kartı önizleyerek
        yayımlayın. Buradaki kartlar Oyunlar sayfasındaki “Yayımlanmış oyunlar
        ve finalistler” bölümünde görünür.
      </p>
      <p className={styles.status} role="status">
        {message}
      </p>
      <div className={styles.toolbar}>
        <button type="button" disabled={busy} onClick={() => select(null)}>
          Yeni oyun ekle
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
        {items.map((game) => (
          <article className={styles.card} key={game.id}>
            <h3>{game.title}</h3>
            <p>
              {game.published ? "Yayında" : "Taslak"} · Sıra {game.position}
            </p>
            <button
              type="button"
              disabled={busy}
              aria-pressed={selected?.id === game.id}
              onClick={() => select(game)}
            >
              {game.title} düzenle
            </button>
          </article>
        ))}
      </div>
      <div className={styles.card}>
        <h3>{selected ? "Oyun bilgilerini düzenle" : "Yeni oyun"}</h3>
        <form
          noValidate
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave(selected?.published ? "save" : "draft");
          }}
          aria-label="Oyun bilgileri"
        >
          <div className={styles.row}>
            <label className="field">
              Oyun adı
              <input
                value={draft.title}
                onChange={(event) => change("title", event.target.value)}
                required
                maxLength={200}
              />
            </label>
            <label className="field">
              Kart etiketi
              <input
                value={draft.label}
                onChange={(event) => change("label", event.target.value)}
                required
                maxLength={120}
              />
            </label>
          </div>
          <label className="field">
            Ekip / yapımcı bilgisi
            <input
              value={draft.credit}
              onChange={(event) => change("credit", event.target.value)}
              required
              maxLength={300}
            />
          </label>
          <label className="field">
            Oyun açıklaması
            <textarea
              value={draft.description}
              onChange={(event) => change("description", event.target.value)}
              maxLength={10000}
              rows={4}
            />
          </label>
          <div className={styles.row}>
            <label className="field">
              itch.io oyun bağlantısı
              <input
                type="url"
                value={draft.href}
                onChange={(event) => change("href", event.target.value)}
                required
                maxLength={500}
                placeholder="https://ekip.itch.io/oyun"
              />
            </label>
            <label className="field">
              Sayfadaki sıra
              <input
                type="number"
                value={draft.position}
                onChange={(event) =>
                  change("position", Number(event.target.value))
                }
                min={0}
                max={10000}
                required
              />
              <small>Küçük sayı önce gösterilir.</small>
            </label>
          </div>
          <SiteAssetPicker
            scope="games"
            label="Oyun kapak görseli"
            value={draft.image}
            onChange={(path) => change("image", path)}
            disabled={busy}
          />
          <label className="field">
            Kapak görseli açıklaması
            <input
              value={draft.alt}
              onChange={(event) => change("alt", event.target.value)}
              required
              maxLength={250}
            />
          </label>
          <div className={styles.actions}>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSave(selected?.published ? "save" : "draft")}
            >
              {busy
                ? "Kaydediliyor…"
                : selected?.published
                  ? "Değişiklikleri kaydet"
                  : "Taslağı kaydet"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSave(selected?.published ? "draft" : "publish")}
            >
              {selected?.published ? "Yayından kaldır" : "Yayımla"}
            </button>
          </div>
        </form>
        {selected && (
          <div className={styles.toolbar}>
            <Dialog
              key={selected.id}
              title="Oyunu sil"
              trigger="Oyunu sil"
              onOpen={() => setDeleteError("")}
            >
              <p>
                {selected.title} kartı siteden kaldırılacak. Görsel dosyası
                korunur.
              </p>
              <p role="alert">{deleteError}</p>
              <button
                type="button"
                className={styles.danger}
                disabled={busy}
                onClick={() => void remove()}
              >
                Silmeyi onayla
              </button>
            </Dialog>
          </div>
        )}
      </div>
      <section className={styles.preview} aria-label="Oyun kartı önizleme">
        <h3>Sitedeki görünümü</h3>
        {draft.title && draft.image ? (
          <SiteGameCard game={draft} />
        ) : (
          <p className={styles.empty}>
            Oyun adını ve kapak görselini seçtiğinizde kart burada görünür.
          </p>
        )}
      </section>
    </section>
  );
}
