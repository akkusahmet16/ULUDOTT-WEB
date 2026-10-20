"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type { PeopleEntry, MemberFields } from "./people-domain";
import { SiteAssetPicker } from "../media/ui/site-asset-picker";
import { formRequest } from "../forms/ui/admin-fetch";
import { Dialog } from "../../components/design-system/dialog";
import styles from "../admin/ui/content-workspace.module.css";
type ChapterOption = { slug: string; title: string; role: string };

function PersonForm({
  item,
  chapters,
  busy,
  save,
}: {
  item?: Extract<PeopleEntry, { kind: "member" }>;
  chapters: ChapterOption[];
  busy: boolean;
  save: (fields: MemberFields, item?: PeopleEntry) => Promise<void>;
}) {
  const fields = item?.fields;
  const [photo, setPhoto] = useState(fields?.photo ?? "");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await save(
      {
        name: String(form.get("name")),
        role: String(form.get("role")),
        quote: String(form.get("quote")),
        details: String(form.get("details"))
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        photo,
        chapterSlug: String(form.get("chapterSlug")),
        position: Number(form.get("position")),
      },
      item,
    );
  }
  return (
    <form className={styles.form} onSubmit={(event) => void submit(event)}>
      <div className={styles.row}>
        <label className="field">
          Ad soyad
          <input
            name="name"
            defaultValue={fields?.name ?? ""}
            maxLength={100}
            required
          />
        </label>
        <label className="field">
          Görev
          <input
            name="role"
            defaultValue={fields?.role ?? ""}
            maxLength={100}
            required
          />
        </label>
      </div>
      <div className={styles.row}>
        <label className="field">
          Bölüm
          <select
            aria-label="Bölüm"
            name="chapterSlug"
            defaultValue={fields?.chapterSlug ?? chapters[0]?.slug}
          >
            {chapters.map((chapter) => (
              <option key={chapter.slug} value={chapter.slug}>
                {chapter.role} · {chapter.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Bölüm içi sıra
          <input
            name="position"
            type="number"
            min={0}
            max={10000}
            defaultValue={fields?.position ?? 100}
            required
          />
          <small>Küçük sayı önce gösterilir.</small>
        </label>
      </div>
      <label className="field">
        Alıntı
        <textarea
          name="quote"
          defaultValue={fields?.quote ?? ""}
          maxLength={400}
          rows={3}
        />
      </label>
      <label className="field">
        Bilgiler (her satır bir bilgi)
        <textarea
          name="details"
          defaultValue={fields?.details.join("\n") ?? ""}
          rows={3}
          maxLength={1004}
        />
        <small>En fazla 5 satır; her satır en fazla 200 karakter.</small>
      </label>
      <SiteAssetPicker
        scope="people"
        label="Kişi fotoğrafı"
        value={photo}
        onChange={setPhoto}
        disabled={busy}
      />
      <div className={styles.actions}>
        <button type="submit" disabled={busy}>
          {busy ? "Kaydediliyor…" : item ? "Kaydet" : "Kişiyi ekle"}
        </button>
        <small>Kaydedilince sitede görünür.</small>
      </div>
    </form>
  );
}
function ChapterForm({
  item,
  busy,
  save,
}: {
  item: Extract<PeopleEntry, { kind: "chapter" }>;
  busy: boolean;
  save: (fields: unknown, item: PeopleEntry) => Promise<void>;
}) {
  const [video, setVideo] = useState(item.fields.video),
    [poster, setPoster] = useState(item.fields.poster);
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        void save(
          {
            title: String(form.get("title")),
            role: String(form.get("role")),
            video,
            videoVisible: form.get("videoVisible") === "on",
            poster,
          },
          item,
        );
      }}
    >
      <label className="field">
        Bölüm başlığı
        <input
          name="title"
          defaultValue={item.fields.title}
          maxLength={100}
          required
        />
      </label>
      <label className="field">
        Görev
        <input
          name="role"
          defaultValue={item.fields.role}
          maxLength={100}
          required
        />
      </label>
      <label className={styles.toggle}>
        <input
          type="checkbox"
          name="videoVisible"
          defaultChecked={item.fields.videoVisible}
          disabled={busy}
        />
        Açılış videosunu sitede göster
      </label>
      <small>
        Gizlediğiniz video kaydı korunur; yeniden göstermek için bu seçeneği
        açın.
      </small>
      <SiteAssetPicker
        scope="people"
        kind="video"
        label="Açılış videosu"
        value={video}
        onChange={setVideo}
        disabled={busy}
      />
      <SiteAssetPicker
        scope="people"
        label="Video kapak görseli"
        value={poster}
        onChange={setPoster}
        disabled={busy}
      />
      <button type="submit" disabled={busy}>
        Kaydet
      </button>
    </form>
  );
}
export function PeopleEditor() {
  const [items, setItems] = useState<PeopleEntry[]>([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [adding, setAdding] = useState(false),
    [loaded, setLoaded] = useState(false),
    [deleteError, setDeleteError] = useState("");
  const [query, setQuery] = useState("");
  const [chapterFilter, setChapterFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  async function refresh() {
    const response = await fetch("/api/admin/people", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw Error(result.error);
    setItems(result.items);
    setLoaded(true);
  }
  useEffect(() => {
    void refresh().catch((error) => setMessage(error.message));
  }, []);
  async function save(fields: unknown, item?: PeopleEntry) {
    setBusy(true);
    setMessage("");
    try {
      await formRequest("/api/admin/people", {
        action: item ? "save" : "create",
        ...(item ? { slot: item.slot, expectedRevision: item.revision } : {}),
        fields,
      });
      await refresh();
      setAdding(false);
      setMessage("İçerik kaydedildi. Hakkımızda sayfasında yayımlandı.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "İşlem tamamlanamadı",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove(item: PeopleEntry) {
    setBusy(true);
    setMessage("");
    try {
      await formRequest("/api/admin/people", {
        action: "remove",
        slot: item.slot,
        expectedRevision: item.revision,
      });
      await refresh();
      setMessage("Kişi silindi. Hakkımızda sayfasından kaldırıldı.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "İşlem tamamlanamadı";
      setMessage(message);
      setDeleteError(message);
    } finally {
      setBusy(false);
    }
  }
  const chapters = items
    .filter(
      (item): item is Extract<PeopleEntry, { kind: "chapter" }> =>
        item.kind === "chapter",
    )
    .map((item) => ({
      slug: item.slot.slice(8),
      title: item.fields.title,
      role: item.fields.role,
    }));
  const filtered = items.filter((item) => {
    const chapter =
      item.kind === "chapter" ? item.slot.slice(8) : item.fields.chapterSlug;
    const title =
      item.kind === "chapter" ? item.fields.title : item.fields.name;
    return (
      (kindFilter === "all" || item.kind === kindFilter) &&
      (chapterFilter === "all" || chapterFilter === chapter) &&
      title
        .toLocaleLowerCase("tr-TR")
        .includes(query.trim().toLocaleLowerCase("tr-TR"))
    );
  });
  return (
    <section
      className={styles.workspace}
      aria-label="Hakkımızda içerik düzenleyici"
    >
      <p className={styles.status} role="status">
        {message}
      </p>
      <div className={styles.toolbar}>
        <button
          type="button"
          disabled={busy || !loaded}
          onClick={() => setAdding(!adding)}
        >
          {adding ? "Yeni kişiden vazgeç" : "Yeni kişi ekle"}
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
        <span>
          {items.filter((item) => item.kind === "member").length} kişi ·{" "}
          {chapters.length} bölüm
        </span>
      </div>
      <div className={styles.toolbar} role="group" aria-label="İçerik türü">
        {[
          { value: "all", label: "Tümü" },
          { value: "member", label: "Kişiler" },
          { value: "chapter", label: "Bölüm ve videolar" },
        ].map((filter) => (
          <button
            key={filter.value}
            type="button"
            aria-pressed={kindFilter === filter.value}
            onClick={() => setKindFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <div className={styles.row}>
        <label className="field">
          Kişi veya bölüm ara
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ad veya bölüm adı…"
          />
        </label>
        <label className="field">
          Bölüm filtresi
          <select
            value={chapterFilter}
            onChange={(event) => setChapterFilter(event.target.value)}
          >
            <option value="all">Bütün bölümler</option>
            {chapters.map((chapter) => (
              <option key={chapter.slug} value={chapter.slug}>
                {chapter.role} · {chapter.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      {adding && (
        <section className={styles.card} aria-label="Yeni kişi">
          <h2>Yeni kişi</h2>
          <PersonForm chapters={chapters} busy={busy} save={save} />
        </section>
      )}
      {!loaded && <p>İçerikler hazırlanıyor…</p>}
      {items.map((item) => (
        <details
          key={`${item.slot}:${item.revision}`}
          hidden={!filtered.includes(item)}
          className={`people-editor-item ${styles.card}`}
        >
          <summary>
            {item.kind === "chapter" ? "Bölüm" : "Kişi"} ·{" "}
            {item.kind === "chapter" ? item.fields.title : item.fields.name}
            <small>
              {item.kind === "member"
                ? `${chapters.find((c) => c.slug === item.fields.chapterSlug)?.role} / sıra ${item.fields.position}`
                : "Açılış sahnesi"}
            </small>
          </summary>
          {item.kind === "chapter" ? (
            <>
              <p>
                {
                  items.filter(
                    (member) =>
                      member.kind === "member" &&
                      member.fields.chapterSlug === item.slot.slice(8),
                  ).length
                }{" "}
                kişi ·{" "}
                {item.fields.video && item.fields.videoVisible
                  ? "Açılış videosu var. Bölüm sitede görünür."
                  : item.fields.video
                    ? "Açılış videosu gizli. Bölüm, içinde kişi varsa başlıkla görünür."
                    : "Açılış videosu yok. Bölüm, içinde kişi varsa sitede görünür."}
              </p>
              <Link
                href={`/hakkimizda#people-${item.slot.slice(8)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Bölümü sitede görüntüle ↗
              </Link>
              <ChapterForm item={item} busy={busy} save={save} />
            </>
          ) : (
            <>
              <PersonForm
                item={item}
                chapters={chapters}
                busy={busy}
                save={save}
              />
              <div className={styles.toolbar}>
                <Dialog
                  title="Kişiyi sil"
                  trigger="Kişiyi sil"
                  onOpen={() => setDeleteError("")}
                >
                  <p>
                    {item.fields.name} siteden kaldırılacak. Fotoğraf ve video
                    dosyaları korunur.
                  </p>
                  <p role="alert">{deleteError}</p>
                  <button
                    type="button"
                    disabled={busy}
                    className={styles.danger}
                    onClick={() => void remove(item)}
                  >
                    Silmeyi onayla
                  </button>
                </Dialog>
              </div>
            </>
          )}
        </details>
      ))}
      {loaded && !filtered.length && (
        <p className={styles.empty}>Aramaya uygun kişi veya bölüm yok.</p>
      )}
    </section>
  );
}
