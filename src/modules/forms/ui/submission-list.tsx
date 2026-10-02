"use client";
import { useState } from "react";
import Link from "next/link";
import { formRequest } from "./admin-fetch";
export const statusLabels: Record<string, string> = {
  received: "Alındı",
  pending: "İncelemede",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  withdrawn: "Geri çekildi",
  waitlisted: "Bekleme listesi",
};
type Row = {
  id: string;
  email: string | null;
  status: string;
  createdAt: string;
};
export function SubmissionList({
  forms,
}: {
  forms: { id: string; title: string }[];
}) {
  const [formId, setFormId] = useState(forms[0]?.id ?? ""),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [items, setItems] = useState<Row[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const filters = {
    ...(q ? { q } : {}),
    ...(status ? { status } : {}),
    ...(from ? { from: from + "T00:00:00.000Z" } : {}),
    ...(to ? { to: to + "T23:59:59.999Z" } : {}),
  };
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "İşlem tamamlanamadı");
    } finally {
      setBusy(false);
    }
  }
  async function load(next: string | null = null) {
    await action(async () => {
      const p = new URLSearchParams({
        formId,
        ...filters,
        ...(next ? { cursor: next } : {}),
      });
      const r = await fetch("/api/admin/submissions?" + p, {
        cache: "no-store",
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setItems(d.items);
      setCursor(d.nextCursor);
      setLoaded(true);
    });
  }
  async function download(format: "csv" | "xlsx") {
    await action(async () => {
      const c = await fetch("/api/admin/csrf", { cache: "no-store" });
      if (!c.ok) throw Error("İstek doğrulanamadı");
      const { csrfToken } = await c.json();
      const r = await fetch("/api/admin/submissions/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ formId, format, filters }),
      });
      if (!r.ok) throw Error((await r.json()).error);
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `basvurular-${formId}.${format}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }
  if (!forms.length) return <p>Yetkili olduğunuz bir form bulunmuyor.</p>;
  return (
    <section>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <fieldset disabled={busy}>
          <label className="field">
            Form
            <select
              aria-label="Form"
              value={formId}
              onChange={(e) => {
                setFormId(e.target.value);
                setItems([]);
                setLoaded(false);
                setCursor(null);
              }}
            >
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Arama
            <input
              value={q}
              maxLength={100}
              onChange={(e) => {
                setQ(e.target.value);
                setCursor(null);
              }}
            />
          </label>
          <label className="field">
            Durum
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCursor(null);
              }}
            >
              <option value="">Tümü</option>
              {Object.entries(statusLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Başlangıç (UTC)
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setCursor(null);
              }}
            />
          </label>
          <label className="field">
            Bitiş (UTC)
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setCursor(null);
              }}
            />
          </label>
          <button type="submit">Başvuruları getir</button>{" "}
          <button type="button" onClick={() => void download("csv")}>
            CSV indir
          </button>{" "}
          <button type="button" onClick={() => void download("xlsx")}>
            XLSX indir
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Saklama süresi dolan başvuru ve yanıtlar kalıcı olarak silinecek. Devam edilsin mi?",
                )
              )
                void action(async () => {
                  const d = await formRequest("/api/admin/submissions", {
                    action: "purge",
                    formId,
                  });
                  setMessage(
                    `${d.deleted} kayıt silindi; ${d.blocked} bağlı kayıt ayrı işlem gerektiriyor.`,
                  );
                  setItems([]);
                  setLoaded(false);
                  setCursor(null);
                });
            }}
          >
            Süresi dolan kayıtları temizle
          </button>
        </fieldset>
      </form>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {loaded && (
        <>
          <p>{items.length} kayıt gösteriliyor.</p>
          <ul>
            {items.map((r) => (
              <li key={r.id}>
                <Link href={"/admin/basvurular/" + r.id}>
                  {r.email ?? "Başvuru " + r.id}
                </Link>{" "}
                · {statusLabels[r.status]} ·{" "}
                {new Date(r.createdAt).toLocaleString("tr-TR", {
                  timeZone: "Europe/Istanbul",
                })}
              </li>
            ))}
          </ul>
          {cursor && (
            <button disabled={busy} onClick={() => void load(cursor)}>
              Sonraki sayfa
            </button>
          )}
        </>
      )}
    </section>
  );
}
