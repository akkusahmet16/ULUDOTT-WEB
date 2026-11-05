import type { Locale } from "../../../src/i18n/config.ts";
import { formatDate } from "../../../src/i18n/format.ts";
import { getTranslator } from "../../../src/i18n/translate.ts";

export function CompliantFixture({
  locale,
  count,
  startsAt,
}: {
  locale: Locale;
  count: number;
  startsAt: string;
}) {
  const t = getTranslator(locale);
  return (
    <section aria-label={t("events.upcomingAria")}>
      <h2>{t("events.upcomingHeading")}</h2>
      <p>{formatDate(startsAt, locale)}</p>
      <p>
        {count} / 5 <span aria-hidden="true">↗</span>
      </p>
      <img src="/community/01-anasayfa/anasayfa-hero.webp" alt="" />
    </section>
  );
}
