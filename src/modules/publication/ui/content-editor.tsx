"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "../../../components/design-system/button";
import { Field } from "../../../components/design-system/field";
import { Dialog } from "../../../components/design-system/dialog";
import { ContentView } from "./content-view";
import { formatInstant, type ContentRecord } from "../domain";
type Media = {
  id: string;
  altText: string;
  variants: {
    id: string;
    mimeType: string;
    published: boolean;
    width: number;
    height: number;
  }[];
};
const localInstant = (v: Date | null) =>
  v
    ? new Date(new Date(v).getTime() + 3 * 3600000).toISOString().slice(0, 16)
    : "";
export function ContentEditor({ type }: { type: "event" | "announcement" }) {
  const endpoint = `/api/admin/${type === "event" ? "events" : "announcements"}`;
  const [options, setOptions] = useState<{
    categories: { id: string; name: string }[];
    forms: { id: string; title: string; eventId: string | null }[];
  }>({ categories: [], forms: [] });
  const [items, setItems] = useState<ContentRecord[]>([]),
    [selected, setSelected] = useState<ContentRecord | null>(null),
    [media, setMedia] = useState<Media[]>([]),
    [events, setEvents] = useState<ContentRecord[]>([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState<ContentRecord | null>(null),
    [mobile, setMobile] = useState(true);
  async function refresh() {
    const r = await fetch(endpoint, { cache: "no-store" });
    if (!r.ok) throw Error("İçerik listesi alınamadı");
    const data = await r.json();
    setItems(data.items);
    setOptions(data.options);
  }
  useEffect(() => {
    void refresh().catch((e) => setMessage(e.message));
    void fetch("/api/admin/media", { cache: "no-store" }).then(async (r) => {
      if (r.ok) setMedia((await r.json()).items);
    });
    if (type === "announcement")
      void fetch("/api/admin/events", { cache: "no-store" }).then(async (r) => {
        if (r.ok) setEvents((await r.json()).items);
      });
  }, [endpoint, type]);
  async function mutate(data: unknown) {
    setBusy(true);
    setMessage("");
    try {
      const c = await fetch("/api/admin/csrf", { cache: "no-store" });
      if (!c.ok) throw Error("İstek doğrulanamadı");
      const { csrfToken } = await c.json();
      const r = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify(data),
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error);
      setSelected(result);
      setPreview(null);
      await refresh();
      setMessage(
        (data as { action: string }).action === "save"
          ? "Kaydedildi."
          : "Yayın güncellendi.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "İşlem tamamlanamadı");
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget),
      text = (key: string) => String(form.get(key) ?? ""),
      optional = (key: string) => text(key).trim() || null,
      date = (key: string) =>
        text(key) ? new Date(`${text(key)}:00+03:00`).toISOString() : null;
    const input: Record<string, unknown> = {
      title: text("title"),
      slug: text("slug"),
      excerpt: optional("excerpt"),
      mediaId: optional("mediaId"),
      publishAt: date("publishAt"),
      unpublishAt: date("unpublishAt"),
      seo: { title: text("seoTitle"), description: text("seoDescription") },
    };
    if (type === "event")
      Object.assign(input, {
        kind: text("kind"),
        categoryId: optional("categoryId"),
        description: optional("description"),
        startsAt: date("startsAt"),
        endsAt: date("endsAt"),
        location: optional("location"),
        locationType: text("locationType"),
        organizer: optional("organizer"),
        capacity: text("capacity") ? Number(text("capacity")) : null,
        maxTeamSize: Number(text("maxTeamSize")),
        formId: optional("formId"),
        featuredPosition: text("featuredPosition")
          ? Number(text("featuredPosition"))
          : null,
      });
    else
      Object.assign(input, {
        body: text("body"),
        eventId: optional("eventId"),
        ctaUrl: optional("ctaUrl"),
        ctaLabel: optional("ctaLabel"),
      });
    await mutate({
      action: "save",
      input,
      ...(selected
        ? { id: selected.id, expectedRevision: selected.revision }
        : {}),
    });
  }
  async function showPreview() {
    if (!selected) return;
    const r = await fetch(`${endpoint}?preview=${selected.id}`, {
      cache: "no-store",
    });
    if (!r.ok) {
      setMessage("Önizleme alınamadı");
      return;
    }
    setPreview(await r.json());
  }
  const field = (
    key: string,
    label: string,
    value: string | number | null,
    extra: Record<string, unknown> = {},
  ) => (
    <Field
      key={key}
      id={`${type}-${key}`}
      name={key}
      label={label}
      defaultValue={value ?? ""}
      {...extra}
    />
  );
  return (
    <>
      <p role="status">{message}</p>
      <Button
        className="button secondary"
        onClick={() => {
          setSelected(null);
          setPreview(null);
          setMessage("");
        }}
      >
        Yeni {type === "event" ? "etkinlik" : "duyuru"}
      </Button>
      <form
        key={selected ? `${selected.id}-${selected.revision}` : "new"}
        onSubmit={submit}
        className="content-form"
      >
        {field("title", "Başlık", selected?.title ?? "", {
          required: true,
          maxLength: 180,
        })}
        {field("slug", "Slug", selected?.slug ?? "", {
          required: true,
          pattern: "[a-z0-9]+(-[a-z0-9]+)*",
          hint: "Küçük Latin harfleri, rakam ve tire.",
        })}
        {field("excerpt", "Kısa metin", selected?.excerpt ?? "")}
        <label className="field">
          {type === "event" ? "Açıklama" : "İçerik"}
          <textarea
            name={type === "event" ? "description" : "body"}
            defaultValue={
              type === "event"
                ? (selected?.description ?? "")
                : (selected?.body ?? "")
            }
            required={type === "announcement"}
            maxLength={20000}
            rows={6}
          />
        </label>
        {type === "event" ? (
          <>
            <label className="field">
              Tür
              <select name="kind" defaultValue={selected?.kind ?? "general"}>
                <option value="general">Genel etkinlik</option>
                <option value="ulujam">UluJam</option>
              </select>
            </label>
            <label className="field">
              Kategori
              <select
                name="categoryId"
                defaultValue={selected?.categoryId ?? ""}
              >
                <option value="">Kategori seçilmedi</option>
                {options.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            {field(
              "startsAt",
              "Başlangıç (İstanbul)",
              localInstant(selected?.startsAt ?? null),
              { type: "datetime-local" },
            )}
            {field(
              "endsAt",
              "Bitiş (İstanbul)",
              localInstant(selected?.endsAt ?? null),
              { type: "datetime-local" },
            )}
            {field("location", "Konum", selected?.location ?? "")}
            <label className="field">
              Konum türü
              <select
                name="locationType"
                defaultValue={selected?.locationType ?? "physical"}
              >
                <option value="physical">Fiziksel</option>
                <option value="online">Çevrim içi (HTTPS)</option>
              </select>
            </label>
            {field("organizer", "Düzenleyen ekip", selected?.organizer ?? "")}
            {field("capacity", "Kapasite", selected?.capacity ?? null, {
              type: "number",
              min: 1,
            })}
            {field(
              "maxTeamSize",
              "En fazla takım üyesi",
              selected?.maxTeamSize ?? 6,
              { type: "number", min: 1, max: 100 },
            )}
            {field(
              "featuredPosition",
              "Ana sayfa sırası",
              selected?.featuredPosition ?? null,
              {
                type: "number",
                min: 0,
                hint: "Boş bırakılırsa öne çıkarılmaz. 0 birincil etkinliktir; sıra tekildir.",
              },
            )}
            <label className="field">
              İlişkili form
              <select name="formId" defaultValue={selected?.formId ?? ""}>
                <option value="">Form bağlı değil</option>
                {options.forms
                  .filter((f) => f.eventId === selected?.id)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                    </option>
                  ))}
              </select>
              <small>
                Form oluşturma sonraki aşamada açılır. Kaydedilmiş form aynı
                etkinliğe bağlı olmalıdır.
              </small>
            </label>
          </>
        ) : (
          <>
            <label className="field">
              Bağlı etkinlik
              <select name="eventId" defaultValue={selected?.eventId ?? ""}>
                <option value="">Bağımsız duyuru</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </label>
            {field("ctaLabel", "Bağlantı metni", selected?.ctaLabel ?? "")}
            {field("ctaUrl", "Bağlantı adresi", selected?.ctaUrl ?? "", {
              hint: "Doğrulanmış HTTPS adresi veya mevcut genel sayfa yolu.",
            })}
          </>
        )}
        <label className="field">
          Afiş
          <select name="mediaId" defaultValue={selected?.mediaId ?? ""}>
            <option value="">Afiş yok</option>
            {media.map((m) => (
              <option value={m.id} key={m.id}>
                {m.altText}
                {m.variants.some((v) => v.published) ? "" : " (özel)"}
              </option>
            ))}
          </select>
        </label>
        {field(
          "publishAt",
          "Yayın zamanı (İstanbul)",
          localInstant(selected?.publishAt ?? null),
          { type: "datetime-local", hint: "Boşsa onay anında yayımlanır." },
        )}
        {field(
          "unpublishAt",
          "Kaldırma zamanı (İstanbul)",
          localInstant(selected?.unpublishAt ?? null),
          { type: "datetime-local" },
        )}
        {field("seoTitle", "SEO başlığı", selected?.seo.title ?? "", {
          maxLength: 160,
        })}
        {field(
          "seoDescription",
          "SEO açıklaması",
          selected?.seo.description ?? "",
          { maxLength: 300 },
        )}
        <Button disabled={busy}>
          {selected ? "Değişiklikleri kaydet" : "Taslağı kaydet"}
        </Button>
      </form>
      {selected && (
        <div className="actions">
          <Button disabled={busy} onClick={showPreview}>
            Önizleme
          </Button>
          <Dialog title="Yayın etkisi" trigger="Yayın etkisini göster">
            <p>
              {selected.publishAt
                ? `Yayın: ${formatInstant(selected.publishAt)} İstanbul`
                : "Onayla birlikte herkese açılacak."}
            </p>
            <p>
              {selected.unpublishAt
                ? `Kaldırma: ${formatInstant(selected.unpublishAt)} İstanbul`
                : "Kaldırma zamanı belirlenmedi."}
            </p>
            <p>
              Kaydedilmiş içerik yayımlanır. Afişin yayın hakkını kontrol edin.
              Etkinliğin tarih ve konumu zorunludur; form akışı hazır olmadan
              başvuru bağlantısı gösterilmez.
            </p>
            <Button
              disabled={busy}
              onClick={() =>
                mutate({
                  action: "publish",
                  id: selected.id,
                  expectedRevision: selected.revision,
                  confirmed: true,
                })
              }
            >
              Yayını onayla
            </Button>
          </Dialog>
          <Dialog title="Yayından kaldırma" trigger="Yayından kaldır / arşivle">
            <p>
              İçerik ve eski adresleri genel erişimden kaldırılır; geçmiş
              kayıtlar korunur.
            </p>
            <Button
              disabled={busy}
              onClick={() =>
                mutate({
                  action: "archive",
                  id: selected.id,
                  expectedRevision: selected.revision,
                  confirmed: true,
                })
              }
            >
              Arşivlemeyi onayla
            </Button>
          </Dialog>
          <Button
            disabled={busy}
            onClick={() =>
              mutate({
                action: "draft",
                id: selected.id,
                expectedRevision: selected.revision,
                confirmed: true,
              })
            }
          >
            Taslağa al
          </Button>
          {type === "event" && (
            <>
              <Button
                disabled={busy}
                onClick={() =>
                  mutate({
                    action: "ended",
                    id: selected.id,
                    expectedRevision: selected.revision,
                    confirmed: true,
                  })
                }
              >
                Bitti olarak işaretle
              </Button>
              <Dialog title="Etkinlik iptali" trigger="İptal et">
                <p>
                  Etkinlik iptal etiketiyle görünür; ana sayfada yaklaşan
                  etkinlik olarak gösterilmez.
                </p>
                <Button
                  disabled={busy}
                  onClick={() =>
                    mutate({
                      action: "cancelled",
                      id: selected.id,
                      expectedRevision: selected.revision,
                      confirmed: true,
                    })
                  }
                >
                  İptali onayla
                </Button>
              </Dialog>
            </>
          )}
        </div>
      )}
      {preview && (
        <section aria-label="İçerik önizleme">
          <h2>Kaydedilmiş içerik önizlemesi</h2>
          <Button
            className="button secondary"
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? "Masaüstü önizleme" : "Mobil önizleme"}
          </Button>
          <div className={mobile ? "preview-mobile" : "preview-desktop"}>
            <ContentView
              preview
              item={{
                ...preview,
                image: media.find((m) => m.id === preview.mediaId)
                  ? (() => {
                      const m = media.find((m) => m.id === preview.mediaId)!,
                        v = m.variants.find((v) => v.mimeType === "image/webp");
                      return v
                        ? {
                            id: v.id,
                            altText: m.altText,
                            width: v.width,
                            height: v.height,
                          }
                        : null;
                    })()
                  : null,
                displayStatus: preview.status,
                applicationUrl: null,
              }}
              type={type}
            />
          </div>
        </section>
      )}
      <section aria-label="İçerik listesi">
        <h2>Kayıtlar</h2>
        {!items.length && <p>Henüz kayıt yok.</p>}
        <div className="grid">
          {items.map((item) => (
            <article className="card" key={item.id}>
              <h3>{item.title}</h3>
              <p>
                {
                  (
                    {
                      draft: "Taslak",
                      scheduled: "Planlı",
                      published: "Yayında",
                      ended: "Bitti",
                      cancelled: "İptal",
                      archived: "Arşiv",
                    } as Record<string, string>
                  )[item.status]
                }{" "}
                · Sürüm {item.revision}
              </p>
              <Button
                disabled={busy}
                onClick={async () => {
                  const r = await fetch(`${endpoint}?preview=${item.id}`, {
                    cache: "no-store",
                  });
                  if (r.ok) {
                    setSelected(await r.json());
                    setPreview(null);
                  } else setMessage("İçerik alınamadı");
                }}
              >
                Düzenle
              </Button>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
