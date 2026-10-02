"use client";
import { useState } from "react";
import { formRequest } from "../../forms/ui/admin-fetch";
import { skillLabels } from "../../matching/domain/skills";
import type { ApprovalQueueData } from "../application/approval-service";
import type { ApprovalDecision } from "../domain/approval";
import { ApprovalDetail } from "./approval-detail";
export function ApprovalQueue({
  events,
  initial,
}: {
  events: { id: string; title: string }[];
  initial: ApprovalQueueData;
}) {
  const [eventId, setEvent] = useState(events[0].id),
    [data, setData] = useState<ApprovalQueueData | null>(initial),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [cursor, setCursor] = useState<string | undefined>(),
    [soloCursor, setSoloCursor] = useState<string | undefined>();
  async function load(c?: string, sc?: string) {
    setBusy(true);
    setMessage("");
    try {
      const params = new URLSearchParams({
        eventId,
        ...(c ? { cursor: c } : {}),
        ...(sc ? { soloCursor: sc } : {}),
      });
      const response = await fetch("/api/admin/approvals?" + params, {
          cache: "no-store",
        }),
        d = await response.json();
      if (!response.ok) throw Error(d.error ?? "Liste alınamadı");
      setData(d);
      setCursor(c);
      setSoloCursor(sc);
    } catch (e) {
      setData(null);
      setMessage(e instanceof Error ? e.message : "Liste alınamadı");
    } finally {
      setBusy(false);
    }
  }
  async function decide(
    kind: "team" | "solo",
    id: string,
    revision: number,
    decision: ApprovalDecision,
    reason?: string,
  ) {
    setBusy(true);
    setMessage("");
    try {
      await formRequest("/api/admin/approvals", {
        kind,
        id,
        decision,
        expectedRevision: revision,
        ...(reason ? { reason } : {}),
      });
      await load(cursor, soloCursor);
      setMessage("Karar kaydedildi.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "İşlem tamamlanamadı");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-label="Onay kuyruğu">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <label className="field">
          Etkinlik
          <select
            value={eventId}
            onChange={(e) => {
              setEvent(e.target.value);
              setData(null);
            }}
          >
            {events.map((e) => (
              <option value={e.id} key={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </label>
        <button disabled={busy}>Kuyruğu getir</button>
      </form>
      <p role="status">{message}</p>
      <h2>Takımlar</h2>
      {data?.teams.length === 0 && <p>Takım kaydı yok.</p>}
      {data?.teams.map((t) => (
        <article key={t.id} aria-label={t.name}>
          <h3>{t.name}</h3>
          <p>
            Durum: {t.status} · Kadro sürümü: {t.revision}
          </p>
          <p>
            Gerçek/beklenen: {t.memberCount}/{t.expectedSize} · Yeni onay
            bekleyen: {t.pendingCount}
          </p>
          {t.note && <p>Son karar gerekçesi: {t.note}</p>}
          <ul>
            {t.members.map((m) => (
              <li key={m.id}>
                {m.fullName} ·{" "}
                {m.skills
                  .map((s) => `${skillLabels[s.skill]} ${s.level}/5`)
                  .join(" · ")}{" "}
                · {m.cardStatus} ·{" "}
                {new Date(m.createdAt).toLocaleDateString("tr-TR", {
                  timeZone: "Europe/Istanbul",
                })}
              </li>
            ))}
          </ul>
          <ApprovalDetail
            label={t.name}
            count={t.memberCount}
            busy={busy}
            onDecision={(d, r) => decide("team", t.id, t.revision, d, r)}
          />
        </article>
      ))}
      <h2>Bireysel katılım</h2>
      {data?.solos.length === 0 && <p>Bireysel başvuru yok.</p>}
      {data?.solos.map((a) => (
        <article aria-label={a.fullName} key={a.id}>
          <h3>{a.fullName}</h3>
          <p>{a.status}</p>
          {a.note && <p>Son karar gerekçesi: {a.note}</p>}
          <ApprovalDetail
            label={a.fullName}
            count={1}
            busy={busy}
            onDecision={(d, r) => decide("solo", a.id, a.revision, d, r)}
          />
        </article>
      ))}
      {data && (
        <nav aria-label="Onay sayfaları">
          <button disabled={busy} onClick={() => void load()}>
            İlk sayfaya dön
          </button>
          {data.nextCursor && (
            <button
              disabled={busy}
              onClick={() => void load(data.nextCursor!, soloCursor)}
            >
              Sonraki takımlar
            </button>
          )}
          {data.nextSoloCursor && (
            <button
              disabled={busy}
              onClick={() => void load(cursor, data.nextSoloCursor!)}
            >
              Sonraki bireysel başvurular
            </button>
          )}
        </nav>
      )}
    </section>
  );
}
