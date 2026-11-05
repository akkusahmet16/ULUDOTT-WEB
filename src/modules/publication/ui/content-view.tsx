import Link from "next/link";
import { DEFAULT_LOCALE, type Locale } from "../../../i18n/config.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import {
  formatInstant,
  type ContentRecord,
  type PublicContent,
} from "../domain";
export function ContentView({
  item,
  type,
  preview = false,
  locale = DEFAULT_LOCALE,
}: {
  item: ContentRecord | PublicContent;
  type: "event" | "announcement";
  preview?: boolean;
  locale?: Locale;
}) {
  const t = getTranslator(locale);
  const labels: Record<string, string> = {
    draft: t("events.statusDraft"),
    scheduled: t("events.statusScheduled"),
    published: t("events.statusPublished"),
    ended: t("events.statusEnded"),
    cancelled: t("events.statusCancelled"),
    archived: t("events.statusArchived"),
  };
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
              ? formatInstant(item.startsAt, locale)
              : t("events.dateTbd")}
            {item.endsAt && ` – ${formatInstant(item.endsAt, locale)}`}{" "}
            {t("events.istanbulTzSuffix")}
          </p>
          <p>{item.location ?? t("events.locationTbd")}</p>
          {item.organizer && (
            <p>
              {t("events.organizerPrefix", {
                organizer: item.organizer,
              })}
            </p>
          )}
          {item.capacity && (
            <p>
              {t("events.capacityPrefix", { capacity: item.capacity })}
            </p>
          )}
          <p className="content-body">{item.description}</p>
          {"applicationUrl" in item && item.applicationUrl && (
            <Link className="button" href={item.applicationUrl}>
              {t("common.apply")}
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
          {item.eventId && <p>{t("events.announcementRelatedToEvent")}</p>}
        </>
      )}
    </>
  );
}
export function ContentCard({
  item,
  type,
  locale = DEFAULT_LOCALE,
}: {
  item: PublicContent;
  type: "event" | "announcement";
  locale?: Locale;
}) {
  const t = getTranslator(locale);
  const labels: Record<string, string> = {
    draft: t("events.statusDraft"),
    scheduled: t("events.statusScheduled"),
    published: t("events.statusPublished"),
    ended: t("events.statusEnded"),
    cancelled: t("events.statusCancelled"),
    archived: t("events.statusArchived"),
  };
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
        <p>{formatInstant(item.startsAt, locale)}</p>
      )}
      {type === "event" && item.applicationUrl && (
        <Link className="button" href={item.applicationUrl}>
          {t("common.apply")}
        </Link>
      )}
      <Link
        className="button secondary"
        href={`/${type === "event" ? "etkinlikler" : "duyurular"}/${item.slug}`}
      >
        {type === "event"
          ? t("events.eventDetailsButton")
          : t("events.announcementDetailsButton")}
      </Link>
    </article>
  );
}
