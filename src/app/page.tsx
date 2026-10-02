import { PublicShell } from "../components/layout/public-shell";
import { ButtonLink } from "../components/design-system/button";
import { Card } from "../components/design-system/card";
import { getFeaturedEvents } from "../modules/events/application/event-service";
import { EventCard } from "../modules/events/ui/event-card";
export const dynamic = "force-dynamic";
export default async function HomePage() {
  const featured = await getFeaturedEvents();
  return (
    <PublicShell>
      <section className="hero">
        <p className="eyebrow">Dijital oyun tasarım topluluğu</p>
        <h1>Uludott</h1>
        <h2>
          Fikirden oyuna.
          <br />
          <span>Birlikte.</span>
        </h2>
        <p className="lede">
          Tasarımı, kodu, sanatı ve hikâyeyi aynı masada buluşturuyoruz.
          Öğrenmek, denemek ve oyun üretmek için bir aradayız.
        </p>
        <div className="actions">
          <ButtonLink href="/hakkimizda">Topluluğu tanı</ButtonLink>
          <ButtonLink href="/ulujam" secondary>
            UluJam’i keşfet
          </ButtonLink>
          <ButtonLink href="/destek" secondary>
            Destek ol
          </ButtonLink>
        </div>
      </section>
      {featured.length > 0 && (
        <section className="section" aria-label="Öne çıkan etkinlikler">
          <h2>Yaklaşan buluşmalar</h2>
          <div className="featured-primary">
            <EventCard event={featured[0]} />
          </div>
          {featured.length > 1 && (
            <div className="grid">
              {featured.slice(1).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      )}
      <section className="section">
        <div className="grid">
          <Card>
            <span className="number">01 / TOPLULUK</span>
            <h3>
              Bir fikrin varsa,
              <br />
              bir yerin var.
            </h3>
            <p>Farklı disiplinler, ortak merak: oyun tasarımı.</p>
          </Card>
          <Card>
            <span className="number">02 / BULUŞMALAR</span>
            <h3>
              Sohbet et.
              <br />
              Yeni şeyler dene.
            </h3>
            <p className="empty">
              {featured.length
                ? "Yeni buluşmaları yukarıda keşfedebilirsiniz."
                : "Henüz öne çıkan etkinlik yok. Yeni buluşmalar burada duyurulacak."}
            </p>
          </Card>
          <Card>
            <span className="number">03 / ULUJAM</span>
            <h3>
              Birlikte üretmenin
              <br />
              oyun hâli.
            </h3>
            <p>
              Başvurular henüz açılmadı. Duyurular yayımlandığında ayrıntılar
              paylaşılacak.
            </p>
          </Card>
        </div>
      </section>
    </PublicShell>
  );
}
