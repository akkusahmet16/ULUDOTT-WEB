import { CoffeeTalkCard } from "../../../components/layout/coffee-talk-card";
import { PublicShell } from "../../../components/layout/public-shell";
import { EventCard } from "../../../modules/events/ui/event-card";
import { PastEventPosterCard } from "../../../modules/events/ui/past-event-poster-card";
import styles from "../../../modules/events/ui/past-event-poster-card.module.css";
import { getLocale } from "../../../i18n/server.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import { readHomeEvents } from "../../../modules/publication/ui/public-queries";
import { buildMetadata } from "../../../seo/build-metadata.ts";
export async function generateMetadata() {
  return buildMetadata({ routeId: "events", locale: await getLocale() });
}
export default async function Page() {
  const [locale, { upcoming, past, showLegacyCoffeeTalk }] = await Promise.all([
    getLocale(),
    readHomeEvents(),
  ]);
  const t = getTranslator(locale);
  return (
    <PublicShell>
      <section className="section">
        <h1>{t("events.heading")}</h1>
        <section
          className="event-list-section"
          aria-label={t("events.upcomingAria")}
        >
          <h2>{t("events.upcomingHeading")}</h2>
          {upcoming.length ? (
            <div className="featured-events">
              {upcoming.map((item) => (
                <EventCard key={item.id} event={item} locale={locale} />
              ))}
            </div>
          ) : (
            <p className="event-list-empty">{t("events.upcomingEmpty")}</p>
          )}
        </section>
        <section
          className="event-list-section"
          aria-label={t("events.pastAria")}
        >
          <h2>{t("events.pastHeading")}</h2>
          {past.length || showLegacyCoffeeTalk ? (
            <div className={styles.pastEventsGrid}>
              {past.map((item) => (
                <PastEventPosterCard key={item.id} event={item} locale={locale} />
              ))}
              {showLegacyCoffeeTalk && <CoffeeTalkCard posterOnly locale={locale} />}
            </div>
          ) : (
            <p className="event-list-empty">{t("events.pastEmpty")}</p>
          )}
        </section>
      </section>
    </PublicShell>
  );
}
