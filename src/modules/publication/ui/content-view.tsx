import Link from "next/link";
import {
  formatInstant,
  type ContentRecord,
  type PublicContent,
} from "../domain";
const labels: Record<string, string> = {
  draft: "Taslak",
  scheduled: "Planlı",
  published: "Yayında",
  ended: "Bitti",
  cancelled: "İptal",
  archived: "Arşiv",
};
export function ContentView({
  item,
  type,
  preview = false,
}: {
  item: ContentRecord | PublicContent;
  type: "event" | "announcement";
  preview?: boolean;
}) {
  const image = "image" in item ? item.image : null;
  return (
    <>
      <p className="eyebrow">
        {labels["displayStatus" in item ? item.displayStatus : item.status] ??
          item.status}
      </p>
      <h1>{item.title}</h1>
      {image && (
        <picture className={type === "event" ? "event-poster" : undefined}>
          <img
            src={
              preview
                ? `/api/admin/media?preview=${image.id}`
                : `/media/${image.id}`
            }
            alt={image.altText}
            width={image.width}
            height={image.height}
          />
        </picture>
      )}
      {item.excerpt && <p className="lede">{item.excerpt}</p>}
      {type === "event" ? (
        <>
          <p>
            {item.startsAt
              ? formatInstant(item.startsAt)
              : "Tarih henüz belirlenmedi"}
            {item.endsAt && ` – ${formatInstant(item.endsAt)}`} (İstanbul)
          </p>
          <p>{item.location ?? "Konum henüz belirlenmedi"}</p>
          {item.organizer && <p>Düzenleyen: {item.organizer}</p>}
          {item.capacity && <p>Kapasite: {item.capacity}</p>}
          <p className="content-body">{item.description}</p>
          {"applicationUrl" in item && item.applicationUrl && (
            <Link className="button" href={item.applicationUrl}>
              Başvur
            </Link>
          )}
        </>
      ) : (
        <>
          <p className="content-body">{item.body}</p>
          {item.ctaUrl && item.ctaLabel && (
            <a className="button" href={item.ctaUrl} rel="noopener noreferrer">
              {item.ctaLabel}
            </a>
          )}
          {item.eventId && <p>Bu duyuru bir etkinlikle ilişkilidir.</p>}
        </>
      )}
    </>
  );
}
export function ContentCard({
  item,
  type,
}: {
  item: PublicContent;
  type: "event" | "announcement";
}) {
  return (
    <article
      className={`card ${type === "event" ? "event-card" : "announcement-card"}`}
    >
      <p className="eyebrow">{labels[item.displayStatus]}</p>
      {item.image && (
        <picture className={type === "event" ? "event-poster" : undefined}>
          <img
            src={`/media/${item.image.id}`}
            alt={item.image.altText}
            width={item.image.width}
            height={item.image.height}
          />
        </picture>
      )}
      <h2>{item.title}</h2>
      {item.excerpt && <p>{item.excerpt}</p>}
      {type === "event" && item.startsAt && (
        <p>{formatInstant(item.startsAt)}</p>
      )}
      {type === "event" && item.applicationUrl && (
        <Link className="button" href={item.applicationUrl}>
          Başvur
        </Link>
      )}
      <Link
        className="button secondary"
        href={`/${type === "event" ? "etkinlikler" : "duyurular"}/${item.slug}`}
      >
        {type === "event" ? "Etkinlik ayrıntıları" : "Duyuru ayrıntıları"}
      </Link>
    </article>
  );
}
