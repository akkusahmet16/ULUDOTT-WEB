import Image from "next/image";
import { DEFAULT_LOCALE, type Locale } from "../../i18n/config.ts";
import { getTranslator } from "../../i18n/translate.ts";
export function CoffeeTalkCard({
  locale = DEFAULT_LOCALE,
}: {
  locale?: Locale;
} = {}) {
  const t = getTranslator(locale);
  return (
    <section
      className="coffee-talk-card"
      aria-label={t("home.coffeeTalkAria")}
    >
      <div className="coffee-talk-poster">
        <Image
          src="/community/04-etkinlikler/etkinlik-coffe-talk/etkinlik-coffe-talk-afis.webp"
          alt={t("home.coffeeTalkPosterAlt")}
          width={1080}
          height={1350}
          unoptimized
        />
      </div>
      <div className="coffee-talk-info">
        <p className="eyebrow">{t("home.coffeeTalkEyebrow")}</p>
        <h2>{t("home.coffeeTalkTitle")}</h2>
        <p className="lede">{t("home.coffeeTalkLede")}</p>
        <p>{t("home.coffeeTalkDescription")}</p>
        <dl>
          <div>
            <dt>{t("common.dateLabel")}</dt>
            <dd>{t("home.coffeeTalkDateValue")}</dd>
          </div>
          <div>
            <dt>{t("common.timeLabel")}</dt>
            <dd>{t("home.coffeeTalkTimeValue")}</dd>
          </div>
          <div>
            <dt>{t("common.venueLabel")}</dt>
            <dd>{t("home.coffeeTalkVenueValue")}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
