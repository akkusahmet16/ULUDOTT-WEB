import { CoffeeTalkCard } from "../components/layout/coffee-talk-card";
import { StoryPanels } from "../components/layout/story-panels";
import { DegreeGames } from "../modules/games/ui/degree-games";
import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "../components/layout/public-shell";
import { OpeningGlow } from "../components/layout/opening-glow";
import { coffeeTalkEndsAt } from "../modules/events/domain/legacy-coffee-talk";
import { EventCard } from "../modules/events/ui/event-card";
import { PastEventPosterCard } from "../modules/events/ui/past-event-poster-card";
import posterStyles from "../modules/events/ui/past-event-poster-card.module.css";
import {
  readHomeEvents,
  readHistoricalResults,
  readUlujamPresentation,
} from "../modules/publication/ui/public-queries";
import { getLocale } from "../i18n/server.ts";
import { getTranslator } from "../i18n/translate.ts";
import { buildMetadata } from "../seo/build-metadata.ts";
import styles from "../styles/home.module.css";
export async function generateMetadata() {
  return buildMetadata({ routeId: "home", locale: await getLocale() });
}
export default async function HomePage() {
  const [locale, events, results, ulujam] = await Promise.all([
    getLocale(),
    readHomeEvents(),
    readHistoricalResults(2026),
    readUlujamPresentation(),
  ]);
  const t = getTranslator(locale);
  const pastEvents = events.past.map((event) => ({
    id: event.id,
    endedAt: (event.endsAt ?? event.startsAt)?.getTime() ?? 0,
    node: <PastEventPosterCard key={event.id} event={event} locale={locale} />,
  }));
  if (events.showLegacyCoffeeTalk)
    pastEvents.push({
      id: "legacy-coffee-talk",
      endedAt: coffeeTalkEndsAt.getTime(),
      node: (
        <CoffeeTalkCard key="legacy-coffee-talk" posterOnly locale={locale} />
      ),
    });
  pastEvents.sort((a, b) => b.endedAt - a.endedAt || a.id.localeCompare(b.id));
  const recentPastEvents = pastEvents.slice(0, 4);
  return (
    <PublicShell>
      <section className={`clone-opening ${styles.opening}`}>
        <OpeningGlow>
          <div className={styles.poster}>
            <Image
              src="/community/01-anasayfa/anasayfa-hero.webp"
              alt=""
              width={2560}
              height={1440}
              priority
              sizes="(max-width: 699px) 100vw, 80vw"
            />
          </div>
        </OpeningGlow>
        <div className={styles.openingRow}>
          <div>
            <h1>{t("brand.name")}</h1>
            <p>{t("brand.tagline")}</p>
          </div>
          <Link href="/hakkimizda" className={`button ${styles.softPulse}`}>
            {t("common.discoverCommunity")}
          </Link>
          <div className={styles.openingLinks}>
            <Link href="/ulujam">
              {t("common.discoverUlujam")} <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/iletisim">
              {t("nav.contact")} <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <a
          href="#kesfet"
          className={styles.scrollHint}
          aria-label={t("home.scrollHintAria")}
        >
          <span aria-hidden="true">⌄</span>
        </a>
      </section>
      <StoryPanels
        degreeContent={<DegreeGames results={results} locale={locale} />}
        presentation={ulujam}
      />
      <section className={styles.intro} data-sky="#24223b">
        <p className="eyebrow">{t("home.introEyebrow")}</p>
        <h2>
          {t("home.introHeadingLine1")}
          <br />
          <span>{t("home.introHeadingHighlight")}</span>
        </h2>
        <p>{t("home.introCopy")}</p>
      </section>
      <section
        className={styles.news}
        aria-label={t("home.upcomingEventsAria")}
        data-sky="#17303c"
      >
        <div className={styles.sectionHeading}>
          <h2>{t("home.upcomingEventsHeading")}</h2>
          <Link href="/etkinlikler">
            {t("home.allEventsLink")} <span aria-hidden="true">↗</span>
          </Link>
        </div>
        {events.upcoming.length ? (
          <div className={`featured-events ${styles.eventList}`}>
            {events.upcoming.map((event) => (
              <EventCard key={event.id} event={event} locale={locale} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyEvents}>{t("home.upcomingEventsEmpty")}</p>
        )}
      </section>
      <section
        className="community-world"
        aria-label={t("home.communityWorldAria")}
        data-sky="#223b45"
      >
        <Image
          src="/theme/reference/venue-2.avif"
          alt=""
          width={2560}
          height={1440}
          sizes="100vw"
          unoptimized
        />
        <div>
          <p className="eyebrow">{t("home.communityWorldEyebrow")}</p>
          <h2>
            <span>{t("home.communityWorldHeadingHighlight")}</span>
            <br />
            {t("home.communityWorldHeadingLine2")}
          </h2>
          <p>{t("home.communityWorldCopy")}</p>
          <Link className="button" href="/hakkimizda#yonetim-kurulu">
            {t("home.discoverBoardCta")}
          </Link>
          <Link className="button secondary" href="/hakkimizda#mekanlar">
            {t("home.discoverPlacesCta")}
          </Link>
        </div>
      </section>
      <section
        className={styles.news}
        aria-label={t("home.pastEventsAria")}
        data-sky="#3e2b40"
      >
        <div className={styles.sectionHeading}>
          <h2>{t("home.pastEventsHeading")}</h2>
          <Link href="/etkinlikler">
            {t("home.allEventsLink")} <span aria-hidden="true">↗</span>
          </Link>
        </div>
        {recentPastEvents.length ? (
          <div className={posterStyles.homePastEventsGrid}>
            {recentPastEvents.map((item) => item.node)}
          </div>
        ) : (
          <p className={styles.emptyEvents}>{t("home.pastEventsEmpty")}</p>
        )}
      </section>
      <section
        className={styles.sponsors}
        aria-label={t("home.sponsorsAria")}
        data-sky="#262943"
      >
        <p className="eyebrow">{t("home.sponsorsEyebrow")}</p>
        <div className={styles.sponsorLogos}>
          <Image
            src="/community/01-anasayfa/sponsorlar/sponsor-dijipin-logo.webp"
            alt={t("home.sponsorDijipinAlt")}
            width={2000}
            height={510}
            sizes="(max-width: 699px) 55vw, 280px"
          />
        </div>
      </section>
      <section
        className={styles.lastLinks}
        aria-label={t("home.contactSectionAria")}
        data-sky="#262943"
      >
        <Link href="/iletisim">
          <span className="eyebrow">{t("home.contactEyebrow")}</span>
          <h2>
            {t("home.contactHeadingLine1")}
            <br />
            {t("home.contactHeadingLine2")}
          </h2>
          <span className={styles.cta}>
            {t("nav.contact")} <span aria-hidden="true">→</span>
          </span>
        </Link>
      </section>
    </PublicShell>
  );
}
