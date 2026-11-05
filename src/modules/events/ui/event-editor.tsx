"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Dialog } from "../../../components/design-system/dialog";
import { formatDate } from "../../../i18n/format.ts";
import { ContentView } from "../../publication/ui/content-view";
import {
  formatInstant,
  slugifyContentTitle,
  type ContentRecord,
} from "../../publication/domain";
import { formRequest } from "../../forms/ui/admin-fetch";
import styles from "./event-editor.module.css";

type Media = {
  id: string;
  altText: string;
  variants: {
    id: string;
    mimeType: string;
    published: boolean;
    width: number;
    height: number;
    purpose: string;
  }[];
};
type Options = {
  categories: { id: string; name: string }[];
  forms: { id: string; title: string; eventId: string | null }[];
};
const labels: Record<string, string> = {
  draft: "Taslak",
  scheduled: "Planlı",
  published: "Yayında",
  ended: "Bitti",
  cancelled: "İptal",
  archived: "Arşiv",
};
const localInstant = (date: Date | null) =>
  date
    ? new Date(new Date(date).getTime() + 3 * 3600000)
        .toISOString()
        .slice(0, 16)
    : "";
export function EventEditor({ canCreate = false }: { canCreate?: boolean }) {
  const [items, setItems] = useState<ContentRecord[]>([]);
  const [options, setOptions] = useState<Options>({
    categories: [],
    forms: [],
  });
  const [selected, setSelected] = useState<ContentRecord | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [kind, setKind] = useState("general");
  const [categoryId, setCategoryId] = useState("");
  const [formId, setFormId] = useState("");
  const [preview, setPreview] = useState<ContentRecord | null>(null);
  const [mobile, setMobile] = useState(true);
  const [posterId, setPosterId] = useState("");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterAlt, setPosterAlt] = useState("");
  const [posterRights, setPosterRights] = useState(false);
  const [posterPreview, setPosterPreview] = useState("");
  const [pending, setPending] = useState<ContentRecord | "new" | null>(null);
  async function refresh() {
    const response = await fetch("/api/admin/events", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw Error(data.error ?? "Etkinlikler alınamadı");
    setItems(data.items);
    setOptions(data.options);
    setLoaded(true);
  }
  async function refreshMedia() {
    const response = await fetch("/api/admin/media", { cache: "no-store" });
    if (response.ok) setMedia((await response.json()).items);
  }
  async function choose(item: ContentRecord | "new", force = false) {
    if (dirty && !force) {
      setPending(item);
      setMessage(
        "Kaydedilmemiş değişikliklerin var. Önce kaydet veya aşağıdan kaydetmeden geç.",
      );
      return;
    }
    if (item === "new") {
      setSelected(null);
      setKind("general");
      setCategoryId("");
      setFormId("");
      setPosterId("");
    } else {
      const response = await fetch(`/api/admin/events?preview=${item.id}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        setMessage("Etkinlik alınamadı");
        return;
      }
      const data = await response.json();
      setSelected(data);
      setKind(data.kind);
      setCategoryId(data.categoryId ?? "");
      setFormId(data.formId ?? "");
      setPosterId(data.mediaId ?? "");
    }
    setPosterFile(null);
    setPosterRights(false);
    setPosterAlt("");
    setPreview(null);
    setDirty(false);
    setPending(null);
    setMessage("");
    setEpoch((value) => value + 1);
  }
  useEffect(() => {
    void refresh().catch((error) => setMessage(error.message));
    void refreshMedia().catch(() => {});
    const id = new URLSearchParams(location.search).get("event");
    if (id && /^[a-f0-9-]{36}$/.test(id))
      void fetch(`/api/admin/events?preview=${id}`, { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) return;
          const data = await response.json();
          setSelected(data);
          setKind(data.kind);
          setCategoryId(data.categoryId ?? "");
          setFormId(data.formId ?? "");
          setPosterId(data.mediaId ?? "");
        })
        .catch(() => setMessage("Etkinlik alınamadı"));
  }, []);
  useEffect(() => {
    if (!posterFile) {
      setPosterPreview("");
      return;
    }
    const url = URL.createObjectURL(posterFile);
    setPosterPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [posterFile]);
  async function mutate(body: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const data = await formRequest("/api/admin/events", body);
      setSelected(data);
      setKind(data.kind);
      setCategoryId(data.categoryId ?? "");
      setFormId(data.formId ?? "");
      setPosterId(data.mediaId ?? "");
      setDirty(false);
      setPending(null);
      setPreview(null);
      setEpoch((value) => value + 1);
      await refresh();
      setMessage(
        body.action === "save"
          ? "Kaydedildi. Etkinlik bilgileri güncel."
          : "Yayın güncellendi.",
      );
      return true;
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "İşlem tamamlanamadı",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (key: string) => String(data.get(key) ?? "");
    const optional = (key: string) => text(key).trim() || null;
    const date = (key: string) =>
      text(key) ? new Date(`${text(key)}:00+03:00`).toISOString() : null;
    await mutate({
      action: "save",
      ...(selected
        ? { id: selected.id, expectedRevision: selected.revision }
        : {}),
      input: {
        title: text("title"),
        slug: text("slug") || slugifyContentTitle(text("title")),
        excerpt: optional("excerpt"),
        description: optional("description"),
        startsAt: date("startsAt"),
        endsAt: date("endsAt"),
        location: optional("location"),
        kind,
        year: kind === "ulujam" && text("year") ? Number(text("year")) : null,
        mediaId: posterId || null,
        categoryId: categoryId || null,
        locationType: text("locationType"),
        organizer: optional("organizer"),
        capacity: text("capacity") ? Number(text("capacity")) : null,
        maxTeamSize: Number(text("maxTeamSize") || 6),
        formId: formId || null,
        featuredPosition: selected?.featuredPosition ?? null,
        publishAt: date("publishAt"),
        unpublishAt: date("unpublishAt"),
        seo: { title: text("seoTitle"), description: text("seoDescription") },
      },
    });
  }
  async function uploadPoster() {
    if (!posterFile || !posterRights || !posterAlt.trim()) {
      setMessage("Afişi, görsel açıklamasını ve yayın hakkı onayını tamamla.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const csrf = await fetch("/api/admin/csrf", { cache: "no-store" });
      if (!csrf.ok) throw Error("İstek doğrulanamadı");
      const { csrfToken } = await csrf.json();
      const body = new FormData();
      body.set("file", posterFile);
      body.set("purpose", "event-poster");
      body.set("altText", posterAlt.trim());
      const response = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "x-csrf-token": csrfToken },
        body,
      });
      const uploaded = await response.json();
      if (!response.ok) throw Error(uploaded.error ?? "Afiş yüklenemedi");
      await formRequest("/api/admin/media", {
        action: "publish",
        assetId: uploaded.id,
        confirmed: true,
      });
      await refreshMedia();
      setPosterId(uploaded.id);
      setDirty(true);
      setPosterFile(null);
      setPosterRights(false);
      setMessage("Afiş hazır. Etkinliği kaydederek ilişkilendir.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Afiş yüklenemedi");
    } finally {
      setBusy(false);
    }
  }
  async function showPreview() {
    if (!selected) return;
    const response = await fetch(`/api/admin/events?preview=${selected.id}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      setMessage("Önizleme alınamadı");
      return;
    }
    setPreview(await response.json());
  }
  const filtered = items.filter(
    (item) =>
      item.title
        .toLocaleLowerCase("tr-TR")
        .includes(query.trim().toLocaleLowerCase("tr-TR")) &&
      (filter === "all" || item.status === filter),
  );
  const variant = media
    .find((item) => item.id === posterId)
    ?.variants.find((item) => item.mimeType === "image/webp");
  const selectedMedia = media.find((item) => item.id === posterId);
  const availableForms = options.forms.filter(
    (form) => form.eventId === selected?.id,
  );
  const field = (
    name: string,
    label: string,
    value: string | number | null,
    extra: Record<string, unknown> = {},
  ) => (
    <label className={styles.field}>
      {label}
      <input name={name} defaultValue={value ?? ""} {...extra} />
    </label>
  );
  const transition = (action: string) =>
    selected &&
    mutate({
      action,
      id: selected.id,
      expectedRevision: selected.revision,
      confirmed: true,
    });
  return (
    <section
      className={styles.workspace}
      aria-label="Etkinlik yönetimi çalışma alanı"
    >
      <div className={styles.toolbar}>
        <p>{items.length} kayıt · Tarihler İstanbul saatidir.</p>
        <div>
          {canCreate && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void choose("new")}
            >
              Yeni etkinlik ＋
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            className={styles.secondary}
            onClick={() =>
              void refresh().catch((error) => setMessage(error.message))
            }
          >
            Listeyi yenile
          </button>
        </div>
      </div>
      <p role="status" className={styles.message}>
        {message}
      </p>
      {pending && (
        <div className={styles.unsaved}>
          <p>Kaydetmeden geçersen bu düzenlemeler kaybolur.</p>
          <button type="button" onClick={() => void choose(pending, true)}>
            Kaydetmeden geç
          </button>
          <button
            type="button"
            onClick={() => {
              setPending(null);
              setMessage("");
            }}
          >
            Düzenlemeye dön
          </button>
        </div>
      )}
      <div className={styles.layout}>
        <aside className={styles.list} aria-label="İçerik listesi">
          <h2>Etkinlik kayıtları</h2>
          <label className={styles.field}>
            Etkinlik ara
            <input
              type="search"
              value={query}
              placeholder="Etkinlik adı…"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className={styles.field}>
            Etkinlik durumu
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">Tüm durumlar</option>
              {Object.entries(labels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.records}>
            {filtered.map((item) => (
              <article
                key={item.id}
                className={styles.record}
                data-selected={selected?.id === item.id}
                aria-label={item.title}
              >
                <span className={styles.badge} data-status={item.status}>
                  {labels[item.status] ?? item.status}
                </span>
                <h3>{item.title}</h3>
                <p>
                  {item.startsAt
                    ? formatDate(item.startsAt, "tr", {
                        dateStyle: "medium",
                      })
                    : "Tarih belirlenmedi"}
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void choose(item)}
                >
                  Düzenle
                </button>
              </article>
            ))}
          </div>
          {!loaded ? (
            <p>Etkinlikler hazırlanıyor…</p>
          ) : (
            !filtered.length && <p>Bu aramaya uygun etkinlik yok.</p>
          )}
        </aside>
        <div className={styles.editArea}>
          {canCreate || selected ? (
            <>
              <div className={styles.editorHeading}>
                <div>
                  <p className={styles.kicker}>
                    {selected ? "ETKİNLİĞİ DÜZENLE" : "YENİ ETKİNLİK"}
                  </p>
                  <h2>{selected?.title ?? "Bir sonraki buluşmayı hazırla."}</h2>
                </div>
                <span className={styles.badge}>
                  {dirty
                    ? "Kaydedilmemiş değişiklikler"
                    : selected
                      ? labels[selected.status]
                      : "Yeni kayıt"}
                </span>
              </div>
              <form
                id="etkinlik-duzenleyici"
                aria-label="Etkinlik düzenleyici"
                key={`${selected?.id ?? "new"}:${epoch}`}
                onSubmit={(event) => void submit(event)}
                onChange={() => setDirty(true)}
                className={styles.form}
              >
                <section className={styles.card}>
                  <p className={styles.kicker}>01 / ETKİNLİK BİLGİLERİ</p>
                  {field("title", "Başlık", selected?.title ?? "", {
                    required: true,
                    maxLength: 180,
                  })}
                  {field(
                    "excerpt",
                    "Alt başlık (opsiyonel)",
                    selected?.excerpt ?? "",
                    { maxLength: 500 },
                  )}
                  <label className={styles.field}>
                    Açıklama
                    <textarea
                      name="description"
                      defaultValue={selected?.description ?? ""}
                      maxLength={20000}
                      rows={5}
                    />
                  </label>
                  <div className={styles.row}>
                    {field(
                      "startsAt",
                      "Tarih ve başlangıç saati (İstanbul)",
                      localInstant(selected?.startsAt ?? null),
                      { type: "datetime-local" },
                    )}
                    {field(
                      "endsAt",
                      "Bitiş saati / tarih (İstanbul)",
                      localInstant(selected?.endsAt ?? null),
                      { type: "datetime-local" },
                    )}
                  </div>
                  <p className={styles.hint}>
                    Bitiş tarihi geçtiğinde ana sayfada geçmiş etkinlikler
                    alanına taşınır.
                  </p>
                  {field("location", "Konum", selected?.location ?? "", {
                    maxLength: 500,
                  })}
                  <div className={styles.row}>
                    <label className={styles.field}>
                      Etkinlik türü
                      <select
                        name="kind"
                        value={kind}
                        onChange={(event) => setKind(event.target.value)}
                      >
                        <option value="general">Genel etkinlik</option>
                        <option value="ulujam">UluJam</option>
                      </select>
                    </label>
                    {kind === "ulujam" &&
                      field("year", "UluJam yılı", selected?.year ?? null, {
                        type: "number",
                        min: 2000,
                        max: 2200,
                      })}
                  </div>
                </section>
                <section
                  className={styles.card}
                  aria-label="Etkinlik afişi yükleme"
                >
                  <p className={styles.kicker}>02 / AFİŞ</p>
                  <h3>Görseli hazırla</h3>
                  <p className={styles.hint}>
                    1080 × 1350 piksel. PNG, JPEG veya WebP; en fazla 8 MiB.
                  </p>
                  <div className={styles.posterLayout}>
                    <div className={styles.poster}>
                      {posterPreview || variant ? (
                        <Image
                          unoptimized
                          src={
                            posterPreview ||
                            `/api/admin/media?preview=${variant!.id}`
                          }
                          alt={
                            posterPreview
                              ? "Seçilen afiş önizlemesi"
                              : (selectedMedia?.altText ?? "Afiş önizlemesi")
                          }
                          width={1080}
                          height={1350}
                        />
                      ) : (
                        <span>
                          AFİŞ
                          <br />
                          <small>1080 × 1350</small>
                        </span>
                      )}
                    </div>
                    <div className={styles.uploadFields}>
                      <label className={styles.field}>
                        Afiş dosyası
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) =>
                            setPosterFile(event.target.files?.[0] ?? null)
                          }
                        />
                      </label>
                      <label className={styles.field}>
                        Görsel açıklaması
                        <input
                          value={posterAlt}
                          maxLength={250}
                          onChange={(event) => setPosterAlt(event.target.value)}
                        />
                      </label>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={posterRights}
                          onChange={(event) =>
                            setPosterRights(event.target.checked)
                          }
                        />
                        Görselin yayın hakkını ve varsa kişilerin iznini
                        onaylıyorum.
                      </label>
                      <button
                        type="button"
                        disabled={
                          busy ||
                          !posterFile ||
                          !posterRights ||
                          !posterAlt.trim()
                        }
                        onClick={() => void uploadPoster()}
                      >
                        Afişi yükle ve hazırla
                      </button>
                    </div>
                  </div>
                  <label className={styles.field}>
                    Afiş
                    <select
                      value={posterId}
                      onChange={(event) => {
                        setPosterId(event.target.value);
                        setDirty(true);
                      }}
                    >
                      <option value="">Afiş seçilmedi</option>
                      {media
                        .filter(
                          (item) =>
                            item.id === selected?.mediaId ||
                            item.variants.some(
                              (variant) =>
                                variant.purpose === "event-poster-webp" &&
                                variant.width === 1080 &&
                                variant.height === 1350,
                            ),
                        )
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.altText}
                            {item.variants.some((variant) => variant.published)
                              ? ""
                              : " (özel)"}
                          </option>
                        ))}
                    </select>
                  </label>
                </section>
                <details className={styles.card}>
                  <summary>Gelişmiş etkinlik ayarları</summary>
                  <div className={styles.advanced}>
                    {field(
                      "slug",
                      "Etkinlik adresi (boşsa başlıktan oluşturulur)",
                      selected?.slug ?? "",
                      { pattern: "[a-z0-9]+(-[a-z0-9]+)*" },
                    )}
                    <div className={styles.row}>
                      <label className={styles.field}>
                        Kategori
                        <select
                          name="categoryId"
                          value={categoryId}
                          onChange={(event) =>
                            setCategoryId(event.target.value)
                          }
                        >
                          <option value="">Kategori seçilmedi</option>
                          {categoryId &&
                            !options.categories.some(
                              (item) => item.id === categoryId,
                            ) && (
                              <option value={categoryId}>
                                Mevcut kategori (seçenek listesinde bulunmuyor)
                              </option>
                            )}
                          {options.categories.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={styles.field}>
                        Konum türü
                        <select
                          name="locationType"
                          defaultValue={selected?.locationType ?? "physical"}
                        >
                          <option value="physical">Fiziksel</option>
                          <option value="online">Çevrim içi (HTTPS)</option>
                        </select>
                      </label>
                    </div>
                    {field(
                      "organizer",
                      "Düzenleyen ekip",
                      selected?.organizer ?? "",
                    )}
                    <div className={styles.row}>
                      {field(
                        "capacity",
                        "Kapasite",
                        selected?.capacity ?? null,
                        { type: "number", min: 1 },
                      )}
                      {field(
                        "maxTeamSize",
                        "En fazla takım üyesi",
                        selected?.maxTeamSize ?? 6,
                        { type: "number", min: 1, max: 100 },
                      )}
                    </div>
                    <label className={styles.field}>
                      İlişkili form
                      <select
                        name="formId"
                        value={formId}
                        onChange={(event) => setFormId(event.target.value)}
                      >
                        <option value="">Form bağlı değil</option>
                        {formId &&
                          !availableForms.some(
                            (form) => form.id === formId,
                          ) && (
                            <option value={formId}>
                              Mevcut form (seçenek listesinde bulunmuyor)
                            </option>
                          )}
                        {availableForms.map((form) => (
                          <option key={form.id} value={form.id}>
                            {form.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </details>
                <details className={styles.card}>
                  <summary>Yayın zamanı ve arama görünümü</summary>
                  <div className={styles.advanced}>
                    <div className={styles.row}>
                      {field(
                        "publishAt",
                        "Yayın zamanı (İstanbul)",
                        localInstant(selected?.publishAt ?? null),
                        { type: "datetime-local" },
                      )}
                      {field(
                        "unpublishAt",
                        "Kaldırma zamanı (İstanbul)",
                        localInstant(selected?.unpublishAt ?? null),
                        { type: "datetime-local" },
                      )}
                    </div>
                    <p className={styles.hint}>
                      Yayın zamanını boş bırakırsan onayladığında yayımlanır.
                    </p>
                    {field(
                      "seoTitle",
                      "SEO başlığı",
                      selected?.seo.title ?? "",
                      { maxLength: 160 },
                    )}
                    {field(
                      "seoDescription",
                      "SEO açıklaması",
                      selected?.seo.description ?? "",
                      { maxLength: 300 },
                    )}
                  </div>
                </details>
                <div className={styles.saveBar}>
                  <span>
                    {dirty
                      ? "Değişikliklerin henüz kaydedilmedi."
                      : "Yayımlamadan önce kaydet ve önizle."}
                  </span>
                  <button disabled={busy} type="submit">
                    {busy
                      ? "Kaydediliyor…"
                      : selected
                        ? "Değişiklikleri kaydet"
                        : "Taslağı kaydet"}
                  </button>
                </div>
              </form>
              {selected && (
                <section className={styles.card} aria-label="Etkinlik yayını">
                  <div className={styles.sectionTitle}>
                    <h3>Yayın yönetimi</h3>
                    {["published", "scheduled", "ended", "cancelled"].includes(
                      selected.status,
                    ) && (
                      <Link href={`/etkinlikler/${selected.slug}`}>
                        Sitede gör ↗
                      </Link>
                    )}
                  </div>
                  {dirty && (
                    <p>Önizleme ve yayın için önce değişiklikleri kaydet.</p>
                  )}
                  <div className={styles.actions}>
                    <button
                      type="button"
                      disabled={busy || dirty}
                      onClick={() => void showPreview()}
                    >
                      Önizleme
                    </button>
                    <Dialog
                      title="Yayın etkisi"
                      trigger="Yayın etkisini göster"
                    >
                      <p>
                        {selected.publishAt
                          ? `Yayın: ${formatInstant(selected.publishAt)}`
                          : "Onayladığında sitede görünür."}
                      </p>
                      <p>
                        Tarih ve konum gereklidir. Kaydedilmiş başlık, açıklama
                        ve afiş yayımlanır.
                      </p>
                      <p role="alert">{message}</p>
                      <button
                        disabled={busy || dirty}
                        type="button"
                        onClick={async (event) => {
                          const dialog = event.currentTarget.closest("dialog");
                          if (await transition("publish")) dialog?.close();
                        }}
                      >
                        Yayını onayla
                      </button>
                    </Dialog>
                    <Dialog
                      title="Yayından kaldırma"
                      trigger="Yayından kaldır / arşivle"
                    >
                      <p>
                        Etkinlik genel erişimden kaldırılır; kayıt ve geçmiş
                        korunur.
                      </p>
                      <p role="alert">{message}</p>
                      <button
                        type="button"
                        disabled={busy || dirty}
                        onClick={async (event) => {
                          const dialog = event.currentTarget.closest("dialog");
                          if (await transition("archive")) dialog?.close();
                        }}
                      >
                        Arşivlemeyi onayla
                      </button>
                    </Dialog>
                  </div>
                  <details className={styles.otherActions}>
                    <summary>Diğer durum işlemleri</summary>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        disabled={busy || dirty}
                        onClick={() => void transition("draft")}
                      >
                        Taslağa al
                      </button>
                      <button
                        type="button"
                        disabled={busy || dirty}
                        onClick={() => void transition("ended")}
                      >
                        Bitti olarak işaretle
                      </button>
                      <Dialog title="Etkinlik iptali" trigger="İptal et">
                        <p>
                          Etkinlik iptal etiketiyle görünür ve yaklaşanlar
                          alanından çıkar.
                        </p>
                        <button
                          disabled={busy || dirty}
                          type="button"
                          onClick={async (event) => {
                            const dialog =
                              event.currentTarget.closest("dialog");
                            if (await transition("cancelled")) dialog?.close();
                          }}
                        >
                          İptali onayla
                        </button>
                      </Dialog>
                    </div>
                  </details>
                </section>
              )}
              {preview && (
                <section className={styles.card} aria-label="İçerik önizleme">
                  <div className={styles.sectionTitle}>
                    <h3>Kaydedilmiş içerik önizlemesi</h3>
                    <button type="button" onClick={() => setMobile(!mobile)}>
                      {mobile ? "Masaüstü önizleme" : "Mobil önizleme"}
                    </button>
                  </div>
                  <div
                    className={
                      mobile ? styles.previewMobile : styles.previewDesktop
                    }
                  >
                    <ContentView
                      preview
                      type="event"
                      item={{
                        ...preview,
                        displayStatus: preview.status,
                        applicationUrl: null,
                        image: (() => {
                          const asset = media.find(
                            (asset) => asset.id === preview.mediaId,
                          );
                          const variant = asset?.variants.find(
                            (variant) => variant.mimeType === "image/webp",
                          );
                          return variant && asset
                            ? {
                                id: variant.id,
                                altText: asset.altText,
                                width: variant.width,
                                height: variant.height,
                              }
                            : null;
                        })(),
                      }}
                    />
                  </div>
                </section>
              )}
            </>
          ) : (
            <section className={styles.card}>
              <h2>Bir etkinlik seç</h2>
              <p>
                Yetkili olduğun etkinliği soldaki listeden açarak
                düzenleyebilirsin.
              </p>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
