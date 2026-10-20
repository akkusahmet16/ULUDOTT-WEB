import Link from "next/link";
import Image from "next/image";
import type { PublicContent } from "../../publication/domain";
const date = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", weekday: "long", timeZone: "Europe/Istanbul" });
const time = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });
const day = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", timeZone: "Europe/Istanbul" });
export function EventCard({ event }: { event: PublicContent }) {
  const href = `/etkinlikler/${event.slug}`;
  const start = event.startsAt ? new Date(event.startsAt) : null;
  const end = event.endsAt ? new Date(event.endsAt) : null;
  const closed = ["cancelled", "ended"].includes(event.displayStatus);
  return (
    <article className="coffee-talk-card event-feature-card" aria-label={event.title}>
      <Link className="coffee-talk-poster event-feature-poster" href={href} aria-label={`${event.title} etkinliğinin ayrıntıları`}>
        {event.image ? <Image unoptimized src={`/media/${event.image.id}`} alt={event.image.altText} width={event.image.width} height={event.image.height} /> : <span aria-hidden="true">ULUDOTT<br />ETKİNLİK</span>}
      </Link>
      <div className="coffee-talk-info event-feature-info">
        <p className="eyebrow">{event.displayStatus === "cancelled" ? "İptal" : event.displayStatus === "ended" ? "Bitti" : "Topluluk buluşması"}</p>
        <h2><Link href={href}>{event.title}</Link></h2>
        {event.excerpt && <p className="lede">{event.excerpt}</p>}
        {event.description && <p>{event.description}</p>}
        <dl>
          {start && <div><dt>Tarih</dt><dd>{date.format(start)}</dd></div>}
          {start && <div><dt>Saat</dt><dd>{time.format(start)}{end ? `–${day.format(start) === day.format(end) ? "" : `${day.format(end)} `}${time.format(end)}` : ""}</dd></div>}
          {event.location && <div><dt>Mekân</dt><dd>{event.location}</dd></div>}
        </dl>
        <div className="event-feature-actions">
          {!closed && event.applicationUrl && <Link className="button" href={event.applicationUrl}>Başvur</Link>}
          <Link href={href}>Etkinliği incele <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </article>
  );
}
