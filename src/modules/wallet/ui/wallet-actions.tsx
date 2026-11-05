import { DEFAULT_LOCALE, type Locale } from "../../../i18n/config.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import { GoogleAction } from "./google-action";
import type { getWalletStatus } from "../application/wallet-service";
export function WalletActions({
  status,
  cardToken,
  locale = DEFAULT_LOCALE,
}: {
  status: Awaited<ReturnType<typeof getWalletStatus>>;
  cardToken: string;
  locale?: Locale;
}) {
  const t = getTranslator(locale);
  return (
    <section aria-labelledby="wallet-heading">
      <h2 id="wallet-heading">{t("cards.walletHeading")}</h2>
      {status.eligibility !== "active" ? (
        <p>
          {status.eligibility === "revoked"
            ? t("cards.walletRevokedCopy")
            : t("cards.walletPendingApprovalCopy")}
        </p>
      ) : (
        <>
          <p>
            {t("cards.googleWalletPrefix")}{" "}
            {status.providers.google.readiness === "unconfigured"
              ? t("cards.googleReadinessUnconfigured")
              : status.providers.google.readiness === "published"
                ? t("cards.googleReadinessPublished")
                : t("cards.googleReadinessTesting")}
          </p>
          <p>
            {t("cards.googleCardStatusPrefix")}{" "}
            {status.providers.google.status === "active"
              ? t("cards.statusActive")
              : status.providers.google.status === "revoked"
                ? t("cards.statusRevoked")
                : status.providers.google.status === "failed"
                  ? t("cards.googleStatusFailed")
                  : t("cards.googleStatusPendingProvider")}
          </p>
          {status.providers.google.readiness !== "unconfigured" && (
            <GoogleAction cardToken={cardToken} />
          )}
          <p>{t("cards.appleWalletNotReadyCopy")}</p>
        </>
      )}
    </section>
  );
}
