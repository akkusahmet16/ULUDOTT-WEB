import { PublicShell } from "../../../components/layout/public-shell";
import { readPublicEvents } from "../../../modules/publication/ui/public-queries.ts";
import { EventCard } from "../../../modules/events/ui/event-card";
export const metadata = { title: "Etkinlikler", alternates: { canonical: "/etkinlikler" } };
export default async function Page() {
  const items = await readPublicEvents();
  return (
    <PublicShell>
      <section className="section">
        <h1>Etkinlikler</h1>
        {!items.length && <p>Henüz yayımlanmış etkinlik yok.</p>}
        <div className="grid">
          {items.map((item) => (
            <EventCard key={item.id} event={item} />
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
