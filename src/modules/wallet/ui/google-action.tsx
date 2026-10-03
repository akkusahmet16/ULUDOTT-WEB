"use client";
import { useState } from "react";
export function GoogleAction({ cardToken }: { cardToken: string }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [url, setUrl] = useState<string | null>(null);
  async function prepare() {
    setBusy(true);
    setError("");
    setUrl(null);
    try {
      const csrf = await fetch("/api/admin/csrf", { cache: "no-store" });
      if (!csrf.ok) throw Error();
      const { csrfToken } = await csrf.json();
      const response = await fetch(
        "/api/wallet/google/" + encodeURIComponent(cardToken),
        {
          method: "POST",
          headers: { "x-csrf-token": csrfToken },
          cache: "no-store",
        },
      );
      const data = await response.json();
      if (
        !response.ok ||
        typeof data.url !== "string" ||
        !data.url.startsWith("https://pay.google.com/gp/v/save/")
      )
        throw Error();
      setUrl(data.url);
    } catch {
      setError(
        "Google Wallet bağlantısı oluşturulamadı. Katılım durumunu kontrol edip tekrar deneyin.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button type="button" disabled={busy} onClick={prepare}>
        {busy ? "Bağlantı hazırlanıyor…" : "Google Wallet bağlantısı oluştur"}
      </button>
      {error && <p role="alert">{error}</p>}
      {url && (
        <p>
          <a href={url} rel="noopener noreferrer" target="_blank">
            Google Wallet’ta kartı aç
          </a>
        </p>
      )}
    </div>
  );
}
