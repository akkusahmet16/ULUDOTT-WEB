"use client";
import { useState } from "react";
import { formRequest } from "../../forms/ui/admin-fetch";
export function CheckInPanel() {
  const [token, setToken] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [card, setCard] = useState<{
      id: string;
      revision: number;
      name: string;
      event: string;
      team: string | null;
    } | null>(null);
  async function resolve() {
    setBusy(true);
    setCard(null);
    try {
      setCard(
        await formRequest("/api/admin/check-in", { action: "resolve", token }),
      );
      setToken("");
      setMessage("Aktif giriş kimliği doğrulandı.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Kimlik doğrulanamadı");
    } finally {
      setBusy(false);
    }
  }
  async function rotate() {
    if (!card) return;
    setBusy(true);
    try {
      await formRequest("/api/admin/check-in", {
        action: "rotate",
        id: card.id,
        expectedRevision: card.revision,
      });
      setCard(null);
      setMessage(
        "Eski QR iptal edildi. Katılımcı kart sayfasını yenileyerek yeni QR alabilir.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "İşlem tamamlanamadı");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-label="Giriş kontrolü">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void resolve();
        }}
      >
        <label className="field">
          QR içeriği
          <input
            autoComplete="off"
            maxLength={100}
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </label>
        <button disabled={busy}>Giriş kimliğini doğrula</button>
      </form>
      <p role="status">{message}</p>
      {card && (
        <article>
          <h2>{card.name}</h2>
          <p>
            {card.event} · {card.team ?? "Bireysel katılım"}
          </p>
          <button disabled={busy} onClick={() => void rotate()}>
            Bu giriş QR’ını iptal edip yenile
          </button>
        </article>
      )}
    </section>
  );
}
