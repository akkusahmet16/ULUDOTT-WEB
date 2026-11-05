import Image from "next/image";
import { DEFAULT_LOCALE, type Locale } from "../../../i18n/config.ts";
import { formatLocaleTimestamp } from "../../../i18n/format.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import type { CardView } from "../application/card-service";
import { PendingCard } from "./pending-card";
import styles from "./web-card.module.css";
export function WebCard({
  card,
  locale = DEFAULT_LOCALE,
}: {
  card: CardView;
  locale?: Locale;
}) {
  const t = getTranslator(locale);
  return (
    <article className={styles.ticket} aria-label={t("cards.personalCardAria")}>
      <p className={styles.brand}>{t("cards.brandHeader")}</p>
      <h1>{card.eventTitle}</h1>
      <p className={styles.name}>{card.name}</p>
      <p>{card.teamName ?? t("cards.soloParticipation")}</p>
      {card.startsAt && (
        <time dateTime={card.startsAt}>
          {formatLocaleTimestamp(card.startsAt, locale)}
        </time>
      )}
      <p>
        {t("cards.cardStatusLabel")}{" "}
        <strong>
          {card.status === "active"
            ? t("cards.statusActive")
            : card.status === "pending"
              ? t("cards.statusPending")
              : t("cards.statusRevoked")}
        </strong>
      </p>
      {card.status === "active" ? (
        <section aria-label={t("cards.entryIdentityAria")}>
          {card.qr ? (
            <>
              <Image
                src={card.qr}
                alt={t("cards.entryQrAlt")}
                width={280}
                height={280}
                unoptimized
              />
              <p>{t("cards.qrPrivacyNotice")}</p>
            </>
          ) : (
            <p>{t("cards.qrMissingContactNotice")}</p>
          )}
        </section>
      ) : (
        <PendingCard status={card.status} locale={locale} />
      )}
      <p className={styles.foot}>
        {t("cards.cardFooter", { revision: card.revision })}
      </p>
    </article>
  );
}
