"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { IntegrationStatus } from "../application/dashboard-service";
import { formRequest } from "../../forms/ui/admin-fetch";
import styles from "./dashboard.module.css";
const googleLabels: Record<string, string> = {
  unconfigured: "Kurulu değil",
  demo: "Demo erişimi",
  publishing_pending: "Yayın onayı bekleniyor",
  published: "Yayın erişimi",
};
const jobLabels: Record<string, string> = {
  "card.changed": "Kart eşitleme",
  "wallet.requested": "Wallet eşitleme",
  "game.credit_changed": "Oyun katkısı",
  "media.deleted": "Medya temizliği",
  unknown: "Tanımlanamayan iş",
};
export function SystemStatus({ status }: { status: IntegrationStatus }) {
  const router = useRouter(),
    [selected, setSelected] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [failed, setFailed] = useState(false);
  async function retry() {
    if (!selected || busy) return;
    setBusy(true);
    setMessage("");
    setFailed(false);
    try {
      await formRequest(`/api/admin/outbox/${selected}/retry`, {});
      setSelected(null);
      setMessage("İş kuyruğa alındı.");
      router.refresh();
    } catch {
      setFailed(true);
      setMessage(
        "İş kuyruğa alınamadı. Oturumunuzu ve işin güncel durumunu kontrol edin.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={styles.panel} aria-label="Sistem operasyonları">
      <p>
        Veritabanı erişimi bu sayfa açıldığında kontrol edilir. Depo ve Wallet
        bilgileri kurulum durumudur; sağlayıcı bağlantısının veya worker
        sürecinin çalıştığının kanıtı değildir.
      </p>
      <dl className={styles.metrics}>
        <dt>Veritabanı</dt>
        <dd>Erişilebilir</dd>
        <dt>Dosya deposu</dt>
        <dd>
          {status.storage === "configured" ? "Yapılandırıldı" : "Kurulu değil"}
        </dd>
        <dt>Google Wallet</dt>
        <dd>{googleLabels[status.googleWallet] ?? "Kurulu değil"}</dd>
        <dt>Apple Wallet</dt>
        <dd>Ertelendi</dd>
        <dt>Bekleyen iş</dt>
        <dd>{status.jobs.pending}</dd>
        <dt>İşlenen iş</dt>
        <dd>{status.jobs.processing}</dd>
        <dt>Başarısız iş</dt>
        <dd>{status.jobs.dead}</dd>
      </dl>
      <p role={failed ? "alert" : "status"} aria-live="polite">
        {busy ? "İş kuyruğa alınıyor…" : message}
      </p>
      <h2>Başarısız işler</h2>
      <p>
        En eski 50 başarısız iş gösterilir. İş içeriği ve kişi bilgileri bu
        ekrana taşınmaz.
      </p>
      {!status.failedJobs.length && <p>Başarısız iş yok.</p>}
      {status.failedJobs.map((j) => (
        <article
          className={styles.card}
          key={j.id}
          aria-label={jobLabels[j.type]}
        >
          <h3>{jobLabels[j.type]}</h3>
          <p>Deneme sayısı: {j.attempts}</p>
          <button
            disabled={busy}
            onClick={() => {
              setSelected(j.id);
              setMessage("");
              setFailed(false);
            }}
          >
            İşi yeniden dene
          </button>
          {selected === j.id && (
            <section aria-label="İşlem etki önizlemesi">
              <p>Tek bir başarısız iş kuyruğa geri alınacak.</p>
              <p>
                Deneme sayısı sıfırlanacak. Worker güncel kaydı okuyarak işlemi
                tekrar deneyecek; Wallet işi sağlayıcıdaki kartı
                güncelleyebilir. Kuyruğa alınması işlemin tamamlandığı anlamına
                gelmez.
              </p>
              <button disabled={busy} onClick={() => void retry()}>
                Onayla ve kuyruğa al
              </button>
              <button disabled={busy} onClick={() => setSelected(null)}>
                Vazgeç
              </button>
            </section>
          )}
        </article>
      ))}
    </section>
  );
}
