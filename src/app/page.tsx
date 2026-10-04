import { CoffeeTalkCard } from "../components/layout/coffee-talk-card";
import { StoryPanels } from "../components/layout/story-panels";
import { listPublicHistoricalResults } from "../modules/games/application/historical-results";
import { ResultCard } from "../modules/games/ui/result-card";
import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "../components/layout/public-shell";
import { OpeningGlow } from "../components/layout/opening-glow";
import { getFeaturedEvents } from "../modules/events/application/event-service";
import { EventCard } from "../modules/events/ui/event-card";
import styles from "../styles/home.module.css";
export const dynamic = "force-dynamic";
const SHOW_HOME_GAMES = false;
export default async function HomePage() {
  const [featured, results] = await Promise.all([
    getFeaturedEvents(),
    listPublicHistoricalResults(2026),
  ]);
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
        degreeContent={
          <div className="grid">
            {results.map((result) => (
              <ResultCard key={result.id} result={result} />
            ))}
          </div>
        }
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
        className={styles.destinations}
        aria-label="Buluşmalar"
        data-sky="#17303c"
      >
        <Link
          href="/etkinlikler"
          className={`${styles.destination} ${styles.meetings}`}
        >
          <div className={styles.destinationArt}>
            <Image
              src="/community/04-etkinlikler/etkinlik-coffe-talk/etkinlik-coffe-talk-afis.webp"
              alt="Coffee Talk tanışma etkinliği afişi"
              width={1080}
              height={1350}
              sizes="(max-width: 699px) 100vw, 40vw"
            />
          </div>
          <div>
            <span className="eyebrow">Buluşmalar</span>
            <h2>
              Sohbet et.
              <br />
              Yeni şeyler dene.
            </h2>
            <p>Etkinlikleri keşfet, toplulukla buluş.</p>
            <span className={styles.cta}>
              Etkinlikleri keşfet <span aria-hidden="true">→</span>
            </span>
          </div>
        </Link>
        {SHOW_HOME_GAMES && (
          <Link
            href="/oyunlar"
            className={`${styles.destination} ${styles.games}`}
          >
            <div className={styles.destinationArt}>
              <Image
                src="/theme/reference/world.avif"
                alt=""
                width={1920}
                height={1080}
                sizes="(max-width: 699px) 100vw, 40vw"
              />
            </div>
            <div>
              <span className="eyebrow">Oyunlar</span>
              <h2>
                Birlikte üretmenin
                <br />
                oyun hâli.
              </h2>
              <p>Topluluğun yayımlanan oyunlarını ve yapımcılarını keşfet.</p>
              <span className={styles.cta}>
                Oyunlara göz at <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
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
        aria-label="Etkinlikler"
        data-sky="#3e2b40"
      >
        <div className={styles.sectionHeading}>
          <h2>Yaklaşan buluşmalar</h2>
          <Link href="/etkinlikler">
            Tüm etkinlikler <span aria-hidden="true">↗</span>
          </Link>
        </div>
        {featured.length > 0 && (
          <div className="grid">
            {featured.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
        <CoffeeTalkCard />
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
