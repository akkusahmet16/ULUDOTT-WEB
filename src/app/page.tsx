import { StoryPanels } from "../components/layout/story-panels";
import { DegreeGames } from "../modules/games/ui/degree-games";
import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "../components/layout/public-shell";
import { OpeningGlow } from "../components/layout/opening-glow";
import { EventCard } from "../modules/events/ui/event-card";
import {
  readHomeEvents,
  readHistoricalResults,
  readUlujamPresentation,
  readHomepageSettings,
  readSponsorsSettings,
  readPublishedArchives,
} from "../modules/publication/ui/public-queries";
import type { SponsorItem } from "../modules/site-settings/domain/sponsors";
import { getLocale } from "../i18n/server.ts";
import { getTranslator } from "../i18n/translate.ts";
import { buildMetadata } from "../seo/build-metadata.ts";
import styles from "../styles/home.module.css";
export async function generateMetadata() {
  return buildMetadata({ routeId: "home", locale: await getLocale() });
}
export default async function HomePage() {
  const [locale, events, ulujam, homepageData, sponsorsData, archives] =
    await Promise.all([
      getLocale(),
      readHomeEvents(),
      readUlujamPresentation(),
      readHomepageSettings(),
      readSponsorsSettings(),
      readPublishedArchives(),
    ]);
  const activeYear = homepageData.data.storyPanels.activeUlujamYear || 2026;
  const isCustomGames =
    homepageData.data.storyPanels.gamesMode === "custom_games";
  const selectedArchive = isCustomGames
    ? null
    : archives.find((a) => a.year === activeYear);
  const archiveGames = selectedArchive?.games ?? [];
  const results =
    isCustomGames || archiveGames.length > 0
      ? []
      : await readHistoricalResults(activeYear);
  const t = getTranslator(locale);
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
        degreeContent={
          <DegreeGames
            results={results}
            customGames={
              isCustomGames
                ? homepageData.data.storyPanels.customGames
                : undefined
            }
            archiveGames={archiveGames.length > 0 ? archiveGames : undefined}
            year={activeYear}
            locale={locale}
          />
        }
        presentation={ulujam}
        settings={homepageData.data.storyPanels}
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
          src={homepageData.data.communityWorld.image || "/theme/reference/venue-2.avif"}
          alt=""
          width={2560}
          height={1440}
          sizes="100vw"
          unoptimized
        />
        <div>
          <p className="eyebrow">{homepageData.data.communityWorld.eyebrow || t("home.communityWorldEyebrow")}</p>
          <h2>
            <span>{homepageData.data.communityWorld.headingHighlight || t("home.communityWorldHeadingHighlight")}</span>
            <br />
            {homepageData.data.communityWorld.headingLine1 || t("home.communityWorldHeadingLine2")}
          </h2>
          <p>{homepageData.data.communityWorld.copy || t("home.communityWorldCopy")}</p>
          <Link className="button" href={homepageData.data.communityWorld.boardButtonUrl || "/hakkimizda#yonetim-kurulu"}>
            {homepageData.data.communityWorld.boardButtonText || t("home.discoverBoardCta")}
          </Link>
          <Link className="button secondary" href={homepageData.data.communityWorld.placesButtonUrl || "/hakkimizda#mekanlar"}>
            {homepageData.data.communityWorld.placesButtonText || t("home.discoverPlacesCta")}
          </Link>
        </div>
      </section>
      <section
        className={styles.sponsors}
        aria-label={t("home.sponsorsAria")}
        data-sky="#262943"
      >
        <p className="eyebrow">{sponsorsData.data.title || t("home.sponsorsEyebrow")}</p>
        <div className={styles.sponsorLogos}>
          {sponsorsData.data.sponsors.filter((s: SponsorItem) => s.visible).map((sponsor: SponsorItem) => (
            sponsor.websiteUrl ? (
              <a
                key={sponsor.id}
                href={sponsor.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={sponsor.name}
              >
                <Image
                  src={sponsor.logoUrl}
                  alt={sponsor.name || t("home.sponsorDijipinAlt")}
                  width={2000}
                  height={510}
                  sizes="(max-width: 699px) 55vw, 280px"
                  unoptimized
                />
              </a>
            ) : (
              <Image
                key={sponsor.id}
                src={sponsor.logoUrl}
                alt={sponsor.name}
                width={2000}
                height={510}
                sizes="(max-width: 699px) 55vw, 280px"
                unoptimized
              />
            )
          ))}
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
