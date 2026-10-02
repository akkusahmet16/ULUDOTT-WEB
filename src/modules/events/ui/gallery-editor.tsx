"use client";
import { useState, useEffect, type FormEvent } from "react";
import { Button } from "../../../components/design-system/button";
import { historical2026 } from "../../games/domain/historical-result";
type Row = {
  position: number;
  mediaId: string;
  revision: number;
  verifiedAt: string | null;
};
export function GalleryEditor() {
  const [rows, setRows] = useState<Row[]>([]),
    [media, setMedia] = useState<{ id: string; altText: string | null }[]>([]),
    [position, setPosition] = useState(0),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const selected = rows.find((r) => r.position === position);
  async function refresh() {
    const r = await fetch(
      "/api/admin/gallery?eventId=" + historical2026.eventId,
      { cache: "no-store" },
    );
    if (!r.ok) throw Error("Galeri alınamadı");
    setRows(await r.json());
    const m = await fetch("/api/admin/media", { cache: "no-store" });
    if (!m.ok) throw Error("Medya listesi alınamadı");
    setMedia((await m.json()).items);
  }
  useEffect(() => {
    void refresh().catch((e) => setMessage(e.message));
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const c = await fetch("/api/admin/csrf", { cache: "no-store" });
      if (!c.ok) throw Error("İstek doğrulanamadı");
      const { csrfToken } = await c.json();
      const r = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          eventId: historical2026.eventId,
          position,
          mediaId: f.get("mediaId") || null,
          verified: f.has("verified"),
          ...(selected ? { expectedRevision: selected.revision } : {}),
        }),
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error);
      await refresh();
      setMessage("Galeri kaydedildi.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "İşlem tamamlanamadı");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <p role="status">{message}</p>
      <p>
        Yalnız UluJam 2026’ya ait olduğu doğrulanmış görselleri ilişkilendirin.
        Alt metin ve medya yayını Medya panelinden yönetilir. Boş medya seçimi
        slotu kaldırır.
      </p>
      <form
        className="content-form"
        key={`${position}-${selected?.revision ?? 0}`}
        onSubmit={submit}
      >
        <label className="field">
          Galeri konumu
          <input
            type="number"
            min={0}
            max={49}
            value={position}
            onChange={(e) => setPosition(Number(e.target.value))}
            required
          />
        </label>
        <label className="field">
          Arşiv medyası
          <select name="mediaId" defaultValue={selected?.mediaId ?? ""}>
            <option value="">Boş slot</option>
            {media.map((m) => (
              <option key={m.id} value={m.id}>
                {m.altText ?? "Alt metin eksik"}
              </option>
            ))}
          </select>
        </label>
        <label className="check-field">
          <input type="checkbox" name="verified" />
          Bu görsel UluJam 2026’ya aittir; yayın uygunluğunu doğruladım
        </label>
        <Button disabled={busy}>Galeri slotunu kaydet</Button>
      </form>
      <Button
        disabled={busy}
        onClick={() => void refresh().catch((e) => setMessage(e.message))}
      >
        Listeyi yenile
      </Button>
      <ul>
        {rows.map((r) => (
          <li key={r.position}>
            Konum {r.position} · {r.verifiedAt ? "Doğrulandı" : "Gizli"} · Sürüm{" "}
            {r.revision}
          </li>
        ))}
      </ul>
    </>
  );
}
