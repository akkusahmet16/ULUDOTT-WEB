import { CoffeeTalkCard } from "../../../components/layout/coffee-talk-card";
import { PublicShell } from "../../../components/layout/public-shell";
import { EventCard } from "../../../modules/events/ui/event-card";
import { readHomeEvents } from "../../../modules/publication/ui/public-queries";
export const metadata = {
  title: "Etkinlikler — Uludott",
  alternates: { canonical: "/etkinlikler" },
};
export default async function Page() {
  const { upcoming, past, showLegacyCoffeeTalk } = await readHomeEvents();
  return (
    <PublicShell>
      <section className="section">
        <h1>Etkinlikler</h1>
        <section
          className="event-list-section"
          aria-label="Yaklaşan etkinlikler"
        >
          <h2>Yaklaşan Etkinlikler</h2>
          {upcoming.length ? (
            <div className="featured-events">
              {upcoming.map((item) => (
                <EventCard key={item.id} event={item} />
              ))}
            </div>
          ) : (
            <p className="event-list-empty">Yeni etkinlikler yakında burada.</p>
          )}
        </section>
        <section className="event-list-section" aria-label="Geçmiş etkinlikler">
          <h2>Geçmiş Etkinlikler</h2>
          {past.length || showLegacyCoffeeTalk ? (
            <div className="featured-events">
              {past.map((item) => (
                <EventCard key={item.id} event={item} />
              ))}
              {showLegacyCoffeeTalk && <CoffeeTalkCard />}
            </div>
          ) : (
            <p className="event-list-empty">
              Henüz geçmiş etkinlik bulunmuyor.
            </p>
          )}
        </section>
      </section>
    </PublicShell>
  );
}
