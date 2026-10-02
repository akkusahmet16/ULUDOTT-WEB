import { PublicShell } from "../../../components/layout/public-shell";
import { getPublicAnnouncements } from "../../../modules/announcements/application/announcement-service";
import { AnnouncementCard } from "../../../modules/announcements/ui/announcement-card";
export const dynamic = "force-dynamic";
export default async function Page() {
  const items = await getPublicAnnouncements();
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
