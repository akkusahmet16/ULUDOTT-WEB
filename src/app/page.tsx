import { randomInt } from "node:crypto";
import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "../components/layout/public-shell";
import { ButtonLink } from "../components/design-system/button";
import { getFeaturedEvents } from "../modules/events/application/event-service";
import { EventCard } from "../modules/events/ui/event-card";
import { StarCatch } from "../modules/community/star-catch";
import { PairMatch } from "../modules/community/pair-match";
import styles from "../styles/home.module.css";
export const dynamic = "force-dynamic";
const routes = [
  ["/hakkimizda", "Topluluk"],
  ["/ulujam", "UluJam"],
  ["/etkinlikler", "Etkinlikler"],
  ["/duyurular", "Duyurular"],
  ["/oyunlar", "Oyunlar"],
  ["/linkler", "Bağlantılar"],
  ["/destek", "Destek"],
] as const;
export default async function HomePage() {
  const featured = await getFeaturedEvents();
  // Choose order and section gaps once. Hydration and gameplay never reshuffle them.
  const starFirst = randomInt(2) === 0;
  const firstPauseEarly = randomInt(2) === 0;
  const secondPauseEarly = randomInt(2) === 0;
  const firstPause = (
    <div className={styles.pause}>
      <span className="eyebrow">Kısa bir mola · doğrudan oyna</span>
      {starFirst ? <StarCatch /> : <PairMatch />}
    </div>
  );
  const secondPause = (
    <div className={styles.pause}>
      <span className="eyebrow">
        Bir oyun daha · puanlar yalnızca bu sayfada kalır
      </span>
      {starFirst ? <PairMatch /> : <StarCatch />}
    </div>
  );
  return (
    <PublicShell>
      <section className={`clone-opening ${styles.opening}`}>
        <div className={styles.poster}>
          <Image
            src="/theme/reference/poster.avif"
            alt=""
            width={2560}
            height={1440}
            priority
            sizes="(max-width: 699px) 100vw, 80vw"
          />
        </div>
        <div className={styles.openingRow}>
          <div>
            <h1>Uludott</h1>
            <p>Dijital oyun tasarım topluluğu</p>
          </div>
          <ButtonLink href="/hakkimizda">Topluluğu tanı</ButtonLink>
          <div className={styles.openingLinks}>
            <Link href="/ulujam">
              UluJam’i keşfet <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/destek">
              Destek ol <span aria-hidden="true">↗</span>
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
      <nav className={styles.routeStrip} aria-label="Ana sayfa bölüm haritası">
        {routes.map(([href, name]) => (
          <Link href={href} key={href}>
            {name}
            <span aria-hidden="true">↗</span>
          </Link>
        ))}
      </nav>
      <section
        id="kesfet"
        className={styles.features}
        aria-label="Uludott’u keşfet"
      >
        <Link href="/ulujam" className={styles.feature}>
          <Image
            src="/theme/reference/ulujam.avif"
            alt=""
            width={1080}
            height={1600}
            sizes="(max-width: 699px) 100vw, 45vw"
          />
          <span className={styles.arrow} aria-hidden="true">
            ↗
          </span>
          <div>
            <span className="eyebrow">Birlikte üret</span>
            <h2>UluJam</h2>
            <p>Bir fikir. Bir takım. Bir oyun.</p>
            <p>
              Başvurular henüz açılmadı. Duyurular yayımlandığında ayrıntılar
              paylaşılacak.
            </p>
          </div>
        </Link>
        <Link href="/hakkimizda" className={styles.feature}>
          <Image
            src="/theme/reference/community.avif"
            alt=""
            width={1080}
            height={1600}
            sizes="(max-width: 699px) 100vw, 45vw"
          />
          <span className={styles.arrow} aria-hidden="true">
            ↗
          </span>
          <div>
            <span className="eyebrow">Topluluğu tanı</span>
            <h2>Uludott</h2>
            <p>Bir fikrin varsa, bir yerin var.</p>
          </div>
        </Link>
      </section>
      <section className={styles.intro}>
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
      {firstPauseEarly && firstPause}
      <section
        className={styles.destinations}
        aria-label="Etkinlikler ve oyunlar"
      >
        <Link
          href="/etkinlikler"
          className={`${styles.destination} ${styles.meetings}`}
        >
          <div className={styles.destinationArt}>
            <Image
              src="/theme/reference/ulujam.avif"
              alt=""
              width={1080}
              height={1600}
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
      </section>
      {!firstPauseEarly && firstPause}
      <section className={styles.news} aria-label="Etkinlikler ve duyurular">
        <div className={styles.sectionHeading}>
          <h2>Yaklaşan buluşmalar</h2>
          <Link href="/etkinlikler">
            Tüm etkinlikler <span aria-hidden="true">↗</span>
          </Link>
        </div>
        {featured.length ? (
          <div className="grid">
            {featured.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="empty">
            Henüz öne çıkan etkinlik yok. Yeni buluşmalar burada duyurulacak.
          </p>
        )}
        <Link href="/duyurular" className={styles.announcement}>
          <span className="eyebrow">Topluluktan haberler</span>
          <h2>Duyurular</h2>
          <span className={styles.cta}>
            Duyuruları keşfet <span aria-hidden="true">→</span>
          </span>
        </Link>
      </section>
      {secondPauseEarly && secondPause}
      <section className={styles.lastLinks} aria-label="Bağlantılar ve destek">
        <Link href="/linkler">
          <span className="eyebrow">Bağlantılar</span>
          <h2>
            Topluluğa
            <br />
            bağlan.
          </h2>
          <span className={styles.cta}>
            Tüm bağlantılar <span aria-hidden="true">→</span>
          </span>
        </Link>
        <Link href="/destek">
          <span className="eyebrow">Destek</span>
          <h2>
            Birlikte
            <br />
            daha ileri.
          </h2>
          <span className={styles.cta}>
            Destek ol <span aria-hidden="true">→</span>
          </span>
        </Link>
      </section>
      {!secondPauseEarly && secondPause}
      <p className={styles.attribution}>
        Yerel tasarım denemesi: referans görselleri ve yazı tipleri Rockstar
        Games / GTA VI sayfasından alınmıştır.
      </p>
    </PublicShell>
  );
}
