import { DEFAULT_LOCALE, type Locale } from "../../../i18n/config.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import type { CardStatus } from "../domain/card-eligibility";
export function PendingCard({
  status,
  locale = DEFAULT_LOCALE,
}: {
  status: CardStatus;
  locale?: Locale;
}) {
  const t = getTranslator(locale);
  return (
    <section aria-label={t("cards.eligibilityAria")}>
      <h2>
        {status === "pending"
          ? t("cards.pendingHeading")
          : t("cards.closedHeading")}
      </h2>
      <p>
        {status === "pending" ? t("cards.pendingCopy") : t("cards.closedCopy")}
      </p>
      <p>{t("cards.qrAndWalletUnavailableCopy")}</p>
    </section>
  );
}
