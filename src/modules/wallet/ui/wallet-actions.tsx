import { GoogleAction } from "./google-action";
import type { getWalletStatus } from "../application/wallet-service";
export function WalletActions({
  status,
  cardToken,
}: {
  status: Awaited<ReturnType<typeof getWalletStatus>>;
  cardToken: string;
}) {
  return (
    <section aria-labelledby="wallet-heading">
      <h2 id="wallet-heading">Wallet kartları</h2>
      {status.eligibility !== "active" ? (
        <p>
          {status.eligibility === "revoked"
            ? "Wallet hakkı iptal edildi."
            : "Wallet için katılım onayı bekleniyor."}
        </p>
      ) : (
        <>
          <p>
            Google Wallet:{" "}
            {status.providers.google.readiness === "unconfigured"
              ? "Hazır değil; sağlayıcı kimliği bekleniyor."
              : status.providers.google.readiness === "published"
                ? "Yayın erişimi yapılandırıldı."
                : "Test / yayın onayı bekliyor."}
          </p>
          <p>
            Google kart durumu:{" "}
            {status.providers.google.status === "active"
              ? "Aktif"
              : status.providers.google.status === "revoked"
                ? "İptal"
                : status.providers.google.status === "failed"
                  ? "Tekrar deneme bekliyor"
                  : "Sağlayıcıyı bekliyor"}
          </p>
          {status.providers.google.readiness !== "unconfigured" && (
            <GoogleAction cardToken={cardToken} />
          )}
          <p>Apple Wallet: Hazır değil; sertifika ve cihaz testi bekleniyor.</p>
        </>
      )}
    </section>
  );
}
