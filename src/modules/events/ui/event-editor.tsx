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
import { SiteAssetPicker } from "../../media/ui/site-asset-picker";
import styles from "./event-editor.module.css";
import posterStyles from "./event-poster.module.css";

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
  const [preview, setPreview] = useState<ContentRecord | null>(null);
  const [mobile, setMobile] = useState(true);
  const [posterUrl, setPosterUrl] = useState("");
  const [pending, setPending] = useState<ContentRecord | "new" | null>(null);

  async function refresh() {
    const response = await fetch("/api/admin/events", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw Error(data.error ?? "Etkinlikler alınamadı");
    setItems(data.items);
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
      setPosterUrl("");
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
      setPosterUrl(
        data.posterUrl ||
          (data.image?.url ??
            (data.image?.id?.startsWith("/") ? data.image.id : "")) ||
          "",
      );
    }
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
          setPosterUrl(
            data.posterUrl ||
              (data.image?.url ??
                (data.image?.id?.startsWith("/") ? data.image.id : "")) ||
              "",
          );
        })
        .catch(() => setMessage("Etkinlik alınamadı"));
  }, []);
  async function mutate(body: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const data = await formRequest("/api/admin/events", body);
      setSelected(data);
      setKind(data.kind);
      setPosterUrl(
        data.posterUrl ||
          (data.image?.url ??
            (data.image?.id?.startsWith("/") ? data.image.id : "")) ||
          "",
      );
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
    const baseSlug = slugifyContentTitle(text("title")) || "etkinlik";
    const resolvedSlug =
      selected?.slug ||
      (items.some((item) => item.slug === baseSlug)
        ? `${baseSlug}-${Date.now().toString(36).slice(-4)}`
        : baseSlug);
    await mutate({
      action: "save",
      ...(selected
        ? { id: selected.id, expectedRevision: selected.revision }
        : {}),
      input: {
        title: text("title"),
        slug: resolvedSlug,
        excerpt: optional("excerpt"),
        description: optional("description"),
        startsAt: date("startsAt"),
        endsAt: date("endsAt"),
        location: optional("location"),
        kind,
        year: kind === "ulujam" && text("year") ? Number(text("year")) : null,
        posterUrl: posterUrl || null,
        mediaId: posterUrl ? null : (selected?.mediaId ?? null),
        categoryId: selected?.categoryId ?? null,
        locationType: selected?.locationType ?? "physical",
        organizer: selected?.organizer ?? null,
        capacity: selected?.capacity ?? null,
        maxTeamSize: selected?.maxTeamSize ?? 6,
        formId: selected?.formId ?? null,
        ctaUrl: optional("ctaUrl"),
        ctaLabel: optional("ctaLabel"),
        featuredPosition: selected?.featuredPosition ?? null,
        publishAt: date("publishAt"),
        unpublishAt: date("unpublishAt"),
        seo: { title: text("seoTitle"), description: text("seoDescription") },
      },
    });
  }
  async function deleteSelectedEvent() {
    if (!selected) return false;
    const confirmed = window.confirm(
      `"${selected.title}" etkinliğini kalıcı olarak silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz.`,
    );
    if (!confirmed) return false;

    setBusy(true);
    setMessage("");
    try {
      await formRequest("/api/admin/events", {
        action: "delete",
        id: selected.id,
      });
      setSelected(null);
      setDirty(false);
      setPending(null);
      setPreview(null);
      setPosterUrl("");
      setMessage("Etkinlik başarıyla silindi.");
      await refresh();
      return true;
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Silme işlemi başarısız",
      );
      return false;
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
                noValidate
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
                      "Bitiş saati / tarih (opsiyonel)",
                      localInstant(selected?.endsAt ?? null),
                      { type: "datetime-local" },
                    )}
                  </div>
                  <p className={styles.hint}>
                    Burada girilen tarih ve saat bilgileri yalnızca etkinlik kartında bilgi amaçlı gösterilir.
                  </p>
                  {field("location", "Konum (opsiyonel)", selected?.location ?? "", {
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
                  <div className={styles.row}>
                    {field(
                      "ctaUrl",
                      "Buton bağlantısı / Link (opsiyonel)",
                      selected?.ctaUrl ?? "",
                      {
                        maxLength: 2000,
                        placeholder: "https://... veya /basvuru/...",
                      },
                    )}
                    {field(
                      "ctaLabel",
                      "Buton yazısı (opsiyonel)",
                      selected?.ctaLabel ?? "",
                      {
                        maxLength: 80,
                        placeholder: "Başvur",
                      },
                    )}
                  </div>
                  <p className={styles.hint}>
                    Bağlantı girildiğinde ana sayfa ve etkinlikler sayfasındaki etkinlik kartında buton açılır. Buton yazısı boş bırakılırsa &quot;Başvur&quot; görünür.
                  </p>
                </section>
                <section
                  className={styles.card}
                  aria-label="Etkinlik afişi"
                >
                  <p className={styles.kicker}>02 / AFİŞ</p>
                  <h3>Etkinlik Afişi</h3>
                  <p className={styles.hint}>
                    Önerilen boyut 1080 × 1350 piksel. Bilgisayarınızdan afiş yükleyebilir veya kütüphaneden seçebilirsiniz.
                  </p>
                  <div style={{ marginTop: "14px", marginBottom: "16px" }}>
                    <SiteAssetPicker
                      scope="events"
                      kind="image"
                      label="Afiş Görseli (Cihazdan Yükle veya Kütüphaneden Seç)"
                      value={posterUrl}
                      onChange={(path) => {
                        setPosterUrl(path);
                        setDirty(true);
                        setMessage("Afiş güncellendi ve bu etkinliğe otomatik atandı. Değişiklikleri kaydedin.");
                      }}
                    />
                  </div>
                  {posterUrl && (
                    <div className={posterStyles.posterPreviewBox}>
                      <div className={posterStyles.posterThumbnail}>
                        <Image
                          unoptimized
                          src={posterUrl}
                          alt="Seçilen etkinlik afişi"
                          width={72}
                          height={90}
                        />
                      </div>
                      <div className={posterStyles.posterInfo}>
                        <strong>Etkinliğe Atanan Afiş:</strong>
                        <code>{posterUrl}</code>
                        <button
                          type="button"
                          className={posterStyles.removePosterBtn}
                          onClick={() => {
                            setPosterUrl("");
                            setDirty(true);
                            setMessage("Afiş kaldırıldı. Kaydederek onaylayın.");
                          }}
                        >
                          Afişi Kaldır
                        </button>
                      </div>
                    </div>
                  )}
                </section>
                <details className={styles.card}>
                  <summary>Yayın zamanı ve arama görünümü</summary>
                  <div className={styles.advanced}>
                    <div className={styles.row}>
                      {field(
                        "publishAt",
                        "Yayın tarihi (İstanbul)",
                        localInstant(selected?.publishAt ?? null),
                        { type: "datetime-local" },
                      )}
                      {field(
                        "unpublishAt",
                        "Bitiş tarihi (İstanbul)",
                        localInstant(selected?.unpublishAt ?? null),
                        { type: "datetime-local" },
                      )}
                    </div>
                    <p className={styles.hint}>
                      Yayın tarihini boş bırakırsan onayladığında yayımlanır. Bitiş tarihi geçen etkinlikler otomatik olarak geçmiş etkinliklere düşer.
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
                      <Link href="/etkinlikler">
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
                        Kaydedilmiş başlık, açıklama ve afiş yayımlanır.
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
                    <button
                      type="button"
                      disabled={busy}
                      className={posterStyles.deleteEventBtn}
                      onClick={() => void deleteSelectedEvent()}
                    >
                      Etkinliği sil
                    </button>
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
                        applicationUrl: preview.ctaUrl ?? null,
                        image: (() => {
                          if (preview.posterUrl || posterUrl) {
                            const p = preview.posterUrl || posterUrl;
                            return {
                              id: p,
                              url: p,
                              altText: preview.title,
                              width: 1080,
                              height: 1350,
                            };
                          }
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
