"use client";
import { useState } from "react";
import type { ApprovalDecision } from "../domain/approval";
export function ApprovalDetail({
  label,
  count,
  busy,
  onDecision,
}: {
  label: string;
  count: number;
  busy: boolean;
  onDecision: (decision: ApprovalDecision, reason?: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  return (
    <fieldset disabled={busy}>
      <legend>{label} kararı</legend>
      <p>
        Bu karar {count} katılımcının kart durumunu etkiler. Onay yalnız görülen
        kadro sürümüne uygulanır.
      </p>
      <label className="field">
        Karar gerekçesi
        <textarea
          maxLength={1000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <button onClick={() => void onDecision("approved")}>Onayla</button>
      <button
        disabled={!reason.trim()}
        onClick={() => void onDecision("changes_requested", reason)}
      >
        Değişiklik iste
      </button>
      <button
        disabled={!reason.trim()}
        onClick={() => void onDecision("rejected", reason)}
      >
        Reddet
      </button>
    </fieldset>
  );
}
