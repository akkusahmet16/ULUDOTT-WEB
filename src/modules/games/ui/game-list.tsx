"use client";
import { useState } from "react";
import Link from "next/link";
import type { listGames } from "../application/game-service";
export function GameList({
  initial,
}: {
  initial: Awaited<ReturnType<typeof listGames>>;
}) {
  const [data, setData] = useState(initial),
    [eventId, setEvent] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load(cursor?: string) {
    setBusy(true);
    try {
      const q = new URLSearchParams({
        ...(eventId ? { eventId } : {}),
        ...(cursor ? { cursor } : {}),
      });
      const r = await fetch("/api/admin/games?" + q, { cache: "no-store" }),
        d = await r.json();
      if (!r.ok) throw Error(d.error);
      setData(d);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Liste alınamadı");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-label="Oyun kayıtları">
      <h2>Kayıtlar</h2>
      <label className="field">
        Liste etkinliği
        <select value={eventId} onChange={(e) => setEvent(e.target.value)}>
          <option value="">Bütün UluJam etkinlikleri</option>
          {data.events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
      </label>
      <button disabled={busy} onClick={() => void load()}>
        Oyunları getir
      </button>
      <p role="status">{error}</p>
      <ul>
        {data.items.map((g) => (
          <li key={g.id}>
            <Link href={"/admin/oyunlar/" + g.id}>
              {g.title ?? "Adsız arşiv oyunu"} · {g.itchUrl}
            </Link>{" "}
            · {g.historicalPartial ? "Kısmi arşiv" : "Tam kayıt"} ·{" "}
            {g.publishedAt ? "Yayımlanmış" : "Taslak"}
          </li>
        ))}
      </ul>
      {data.nextCursor && (
        <button disabled={busy} onClick={() => void load(data.nextCursor!)}>
          Sonraki oyunlar
        </button>
      )}
    </section>
  );
}
