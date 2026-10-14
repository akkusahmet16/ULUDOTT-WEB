import { PublicShell } from "../../../components/layout/public-shell";
import { readPublicAnnouncements } from "../../../modules/publication/ui/public-queries.ts";
import { AnnouncementCard } from "../../../modules/announcements/ui/announcement-card";
export const metadata = { title: "Duyurular", alternates: { canonical: "/duyurular" } };
export default async function Page() {
  const items = await readPublicAnnouncements();
  return (
    <PublicShell>
      <section className="section">
        <h1>Duyurular</h1>
        {!items.length && <p>Henüz yayımlanmış duyuru yok.</p>}
        <div className="grid">
          {items.map((item) => (
            <AnnouncementCard key={item.id} announcement={item} />
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
