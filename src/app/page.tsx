import { CoffeeTalkCard } from "../components/layout/coffee-talk-card";
import { StoryPanels } from "../components/layout/story-panels";
import { DegreeGames } from "../modules/games/ui/degree-games";
import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "../components/layout/public-shell";
import { OpeningGlow } from "../components/layout/opening-glow";
import { coffeeTalkEndsAt } from "../modules/events/domain/legacy-coffee-talk";
import { PastEventsCarousel } from "../modules/events/ui/past-events-carousel";
import { EventCard } from "../modules/events/ui/event-card";
import {
  readHomeEvents,
  readHistoricalResults,
  readUlujamPresentation,
} from "../modules/publication/ui/public-queries";
import { buildMetadata } from "../seo/build-metadata.ts";
import styles from "../styles/home.module.css";
export const metadata = buildMetadata({ routeId: "home" });
export default async function HomePage() {
  const [events, results, ulujam] = await Promise.all([
    readHomeEvents(),
    readHistoricalResults(2026),
    readUlujamPresentation(),
  ]);
  const pastSlides = events.past.map((event) => ({
    id: event.id,
    title: event.title,
    endedAt: (event.endsAt ?? event.startsAt)?.getTime() ?? 0,
    content: <EventCard event={event} />,
  }));
  if (events.showLegacyCoffeeTalk)
    pastSlides.push({
      id: "legacy-coffee-talk",
      title: "Coffee Talk",
      endedAt: coffeeTalkEndsAt.getTime(),
      content: <CoffeeTalkCard />,
    });
  pastSlides.sort((a, b) => b.endedAt - a.endedAt || a.id.localeCompare(b.id));
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
            <h1>Uludott</h1>
            <p>Dijital oyun tasarım topluluğu</p>
          </div>
          <Link href="/hakkimizda" className={`button ${styles.softPulse}`}>
            Topluluğu tanı
          </Link>
          <div className={styles.openingLinks}>
            <Link href="/ulujam">
              UluJam’i keşfet <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/iletisim">
              İletişim <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <a
          href="#kesfet"
          className={styles.scrollHint}
          aria-label="Sayfayı keşfet"
        >
          <span aria-hidden="true">⌄</span>
        </a>
      </section>
      <StoryPanels
        degreeContent={<DegreeGames results={results} />}
        presentation={ulujam}
      />
      <section className={styles.intro} data-sky="#24223b">
        <p className="eyebrow">Oyunlar, fikirler ve birlikte üretmek.</p>
        <h2>
          Fikirden oyuna.
          <br />
          <span>Birlikte.</span>
        </h2>
        <p>
          Tasarımı, kodu, sanatı ve hikâyeyi aynı masada buluşturuyoruz.
          Öğrenmek, denemek ve oyun üretmek için bir aradayız.
        </p>
      </section>
      <section
        className={styles.news}
        aria-label="Yaklaşan etkinlikler"
        data-sky="#17303c"
      >
        <div className={styles.sectionHeading}>
          <h2>Yaklaşan etkinlikler</h2>
          <Link href="/etkinlikler">
            Tüm etkinlikler <span aria-hidden="true">↗</span>
          </Link>
        </div>
        {events.upcoming.length ? (
          <div className={`featured-events ${styles.eventList}`}>
            {events.upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyEvents}>
            Yeni buluşmalarımız yakında burada.
          </p>
        )}
      </section>
      <section
        className="community-world"
        aria-label="People ve Places"
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
          <p className="eyebrow">People & Places</p>
          <h2>
            <span>Topluluğun</span>
            <br />
            dünyası.
          </h2>
          <p>İnsanlar, buluşmalar ve birlikte üretime alan açan yerler.</p>
          <Link className="button" href="/hakkimizda#yonetim-kurulu">
            Yönetim kurulunu keşfet
          </Link>
          <Link className="button secondary" href="/hakkimizda#mekanlar">
            Mekânları keşfet
          </Link>
        </div>
      </section>
      <section
        className={styles.news}
        aria-label="Geçmiş etkinlikler"
        data-sky="#3e2b40"
      >
        <div className={styles.sectionHeading}>
          <h2>Geçmiş etkinlikler</h2>
          <Link href="/etkinlikler">
            Tüm etkinlikler <span aria-hidden="true">↗</span>
          </Link>
        </div>
        {pastSlides.length ? (
          <PastEventsCarousel slides={pastSlides} />
        ) : (
          <p className={styles.emptyEvents}>
            Geçmiş buluşmalarımız burada yer alacak.
          </p>
        )}
      </section>
      <section
        className={styles.sponsors}
        aria-label="Sponsorlar"
        data-sky="#262943"
      >
        <p className="eyebrow">Sponsorlarımız</p>
        <div className={styles.sponsorLogos}>
          <Image
            src="/community/01-anasayfa/sponsorlar/sponsor-dijipin-logo.webp"
            alt="Dijipin"
            width={2000}
            height={510}
            sizes="(max-width: 699px) 55vw, 280px"
          />
        </div>
      </section>
      <section
        className={styles.lastLinks}
        aria-label="İletişim"
        data-sky="#262943"
      >
        <Link href="/iletisim">
          <span className="eyebrow">İletişim</span>
          <h2>
            Birlikte
            <br />
            konuşalım.
          </h2>
          <span className={styles.cta}>
            İletişim <span aria-hidden="true">→</span>
          </span>
        </Link>
      </section>
    </PublicShell>
  );
}
