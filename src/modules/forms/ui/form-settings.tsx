"use client";
import { useState, type FormEvent } from "react";
import type { FormSettings as Settings } from "../domain/form-settings";
export const emptySettings: Settings = {
  title: "",
  slug: "",
  opensAt: null,
  closesAt: null,
  capacity: null,
  waitlist: false,
  duplicatePolicy: "reject",
  thankYou: "",
  retentionDays: 180,
};
function localTime(s: string | null) {
  if (!s) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(s))
    .replace(" ", "T");
}
export function FormSettings({
  initial,
  onSave,
  busy = false,
}: {
  initial: Settings;
  onSave: (s: Settings) => Promise<void>;
  busy?: boolean;
}) {
  const [s, set] = useState(initial);
  function patch<K extends keyof Settings>(key: K, value: Settings[K]) {
    set({ ...s, [key]: value });
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    await onSave(s);
  }
  return (
    <form className="content-form" onSubmit={save}>
      <label className="field">
        Form başlığı
        <input
          value={s.title}
          onChange={(e) => patch("title", e.target.value)}
          required
          maxLength={160}
        />
      </label>
      <label className="field">
        Form adresi
        <input
          value={s.slug}
          onChange={(e) => patch("slug", e.target.value)}
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
        />
        <small>Örnek: tanisma-basvurusu. Yayın sonrası adres korunur.</small>
      </label>
      {(["opensAt", "closesAt"] as const).map((k) => (
        <label className="field" key={k}>
          {k === "opensAt" ? "Başlangıç (İstanbul)" : "Bitiş (İstanbul)"}
          <input
            type="datetime-local"
            value={localTime(s[k])}
            onChange={(e) =>
              patch(
                k,
                e.target.value
                  ? new Date(e.target.value + ":00+03:00").toISOString()
                  : null,
              )
            }
          />
        </label>
      ))}
      <label className="field">
        Kapasite
        <input
          type="number"
          min={1}
          max={100000}
          value={s.capacity ?? ""}
          onChange={(e) =>
            patch("capacity", e.target.value ? Number(e.target.value) : null)
          }
        />
        <small>Boş bırakırsanız kapasite sınırlanmaz.</small>
      </label>
      <label className="check-field">
        <input
          type="checkbox"
          checked={s.waitlist}
          onChange={(e) => patch("waitlist", e.target.checked)}
        />
        Dolunca bekleme listesine al
      </label>
      <label className="field">
        Tekrar başvuru
        <select
          value={s.duplicatePolicy}
          onChange={(e) =>
            patch(
              "duplicatePolicy",
              e.target.value as Settings["duplicatePolicy"],
            )
          }
        >
          <option value="reject">
            Aynı e-posta ile tekrar başvuruyu engelle
          </option>
          <option value="allow">Tekrar başvuruya izin ver</option>
        </select>
        <small>
          Tekrarı engellemek için tek zorunlu, koşulsuz e-posta alanı ekleyin.
        </small>
      </label>
      <label className="field">
        Teşekkür metni
        <textarea
          required
          value={s.thankYou}
          maxLength={2000}
          onChange={(e) => patch("thankYou", e.target.value)}
        />
      </label>
      <label className="field">
        Saklama süresi (gün)
        <input
          type="number"
          required
          min={1}
          max={3650}
          value={s.retentionDays}
          onChange={(e) => patch("retentionDays", Number(e.target.value))}
        />
      </label>
      <button className="button" disabled={busy}>
        Ayarları kaydet
      </button>
    </form>
  );
}
