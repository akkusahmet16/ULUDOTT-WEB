"use client";
import { useState } from "react";
export function FinalistEditor({
  finalist,
  rank,
  busy,
  onFinalist,
  onAward,
}: {
  finalist: boolean;
  rank: number | null;
  busy: boolean;
  onFinalist: (selected: boolean) => Promise<void>;
  onAward: (rank: number | null) => Promise<void>;
}) {
  const [selected, setSelected] = useState(rank?.toString() ?? "");
  return (
    <fieldset disabled={busy}>
      <legend>Finalist ve derece</legend>
      <p>
        Finalist: {finalist ? "Evet" : "Hayır"} · Derece: {rank ?? "Yok"}
      </p>
      <button type="button" onClick={() => void onFinalist(!finalist)}>
        {finalist ? "Finalist işaretini kaldır" : "Finalist olarak işaretle"}
      </button>
      <label className="field">
        Derece seçimi
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Derece yok</option>
          {[1, 2, 3].map((n) => (
            <option key={n} value={n}>
              {n}. derece
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => void onAward(selected ? Number(selected) : null)}
      >
        Dereceyi kaydet
      </button>
      <p>Bir derece aynı etkinlikte yalnız bir oyunda kullanılabilir.</p>
    </fieldset>
  );
}
