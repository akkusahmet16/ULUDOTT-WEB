"use client";
import { useState, useEffect, useRef } from "react";
import { publicRequest } from "./public-form";
const labels: Record<string, string> = {
  received: "Alındı",
  waitlisted: "Bekleme listesinde",
  pending: "İnceleniyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  withdrawn: "Geri çekildi",
};
export function ReceiptView() {
  const [receipt, setReceipt] = useState<{
      status: string;
      formTitle: string;
      submittedAt: string;
      message: string;
    } | null>(null),
    [error, setError] = useState("");
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token =
      new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    if (!token) {
      setError("Makbuz bağlantısını kullanın.");
      return;
    }
    void publicRequest("/api/submissions/receipt", { token })
      .then(setReceipt)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <section aria-label="Özel makbuz">
      <p role="status">{error}</p>
      {receipt && (
        <>
          <h2>{receipt.formTitle}</h2>
          <p>Durum: {labels[receipt.status] ?? receipt.status}</p>
          <p>{receipt.message}</p>
          <time dateTime={receipt.submittedAt}>
            {new Date(receipt.submittedAt).toLocaleString("tr-TR", {
              timeZone: "Europe/Istanbul",
            })}
          </time>
        </>
      )}
    </section>
  );
}
