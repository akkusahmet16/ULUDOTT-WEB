"use client";
import { useEffect, useState, type FormEvent } from "react";
import type { PeopleEntry } from "./people-content";

export function PeopleEditor() {
  const [items, setItems] = useState<PeopleEntry[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    const response = await fetch("/api/admin/people", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw Error(result.error);
    setItems(result.items);
  }
  useEffect(() => {
    void refresh().catch((error) => setMessage(error.message));
  }, []);
  async function save(event: FormEvent<HTMLFormElement>, item: PeopleEntry) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      const fields =
        item.kind === "chapter"
          ? {
              title: String(form.get("title") ?? ""),
              role: String(form.get("role") ?? ""),
              video: String(form.get("video") ?? ""),
              poster: String(form.get("poster") ?? ""),
            }
          : {
              name: String(form.get("name") ?? ""),
              role: String(form.get("role") ?? ""),
              quote: String(form.get("quote") ?? ""),
              details: String(form.get("details") ?? "")
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
              photo: String(form.get("photo") ?? ""),
            };
      const csrf = await fetch("/api/admin/csrf", { cache: "no-store" });
      if (!csrf.ok) throw Error("İstek doğrulanamadı");
      const { csrfToken } = await csrf.json();
      const response = await fetch("/api/admin/people", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          slot: item.slot,
          expectedRevision: item.revision,
          fields,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      await refresh();
      setMessage(`${item.slot} kaydedildi. Hakkımızda sayfasında yayımlandı.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "İşlem tamamlanamadı",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-label="Yönetim kurulu düzenleyici">
      <p role="status">{message}</p>
      {items.map((item) => {
        const fields = item.fields as unknown as Record<
          string,
          string | string[]
        >;
        return (
          <details
            key={`${item.slot}:${item.revision}`}
            className="people-editor-item"
          >
            <summary>
              {item.kind === "chapter" ? "Bölüm" : "Kişi"} ·{" "}
              {String(fields.title ?? fields.name)}{" "}
            </summary>
            <form
              className="content-form"
              onSubmit={(event) => void save(event, item)}
            >
              <label className="field">
                {item.kind === "chapter" ? "Bölüm başlığı" : "Ad soyad"}
                <input
                  name={item.kind === "chapter" ? "title" : "name"}
                  defaultValue={String(fields.title ?? fields.name)}
                  maxLength={100}
                  required
                />
              </label>
              <label className="field">
                Görev
                <input
                  name="role"
                  defaultValue={String(fields.role)}
                  maxLength={100}
                  required
                />
              </label>
              {item.kind === "chapter" ? (
                <>
                  <label className="field">
                    Açılış videosu yolu
                    <input
                      name="video"
                      defaultValue={String(fields.video)}
                      maxLength={300}
                      required
                    />
                  </label>
                  <label className="field">
                    Video kapak görseli yolu
                    <input
                      name="poster"
                      defaultValue={String(fields.poster)}
                      maxLength={300}
                      required
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="field">
                    Alıntı
                    <textarea
                      name="quote"
                      defaultValue={String(fields.quote)}
                      maxLength={400}
                    />
                  </label>
                  <label className="field">
                    Bilgiler (her satır bir bilgi)
                    <textarea
                      name="details"
                      defaultValue={(fields.details as string[]).join("\n")}
                    />
                  </label>
                  <label className="field">
                    Detay görseli yolu
                    <input
                      name="photo"
                      defaultValue={String(fields.photo)}
                      maxLength={300}
                      required
                    />
                  </label>
                </>
              )}
              <button type="submit" disabled={busy}>
                Kaydet
              </button>
            </form>
          </details>
        );
      })}
    </section>
  );
}
