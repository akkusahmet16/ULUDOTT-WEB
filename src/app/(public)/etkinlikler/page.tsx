import { CoffeeTalkCard } from "../../../components/layout/coffee-talk-card";
import { PublicShell } from "../../../components/layout/public-shell";
import { getPublicEvents } from "../../../modules/events/application/event-service";
import { EventCard } from "../../../modules/events/ui/event-card";
export const dynamic = "force-dynamic";
export default async function Page() {
  const items = await getPublicEvents();
  return (
    <PublicShell>
      <section className="section">
        <h1>Etkinlikler</h1>
        <CoffeeTalkCard />
        <div className="grid">
          {items.map((item) => (
            <EventCard key={item.id} event={item} />
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
