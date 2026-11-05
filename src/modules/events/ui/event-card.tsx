import Link from "next/link";
import Image from "next/image";
import { DEFAULT_LOCALE, type Locale } from "../../../i18n/config.ts";
import { formatDate, formatTime } from "../../../i18n/format.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import type { PublicContent } from "../../publication/domain";
export function EventCard({
  event,
  locale = DEFAULT_LOCALE,
}: {
  event: PublicContent;
  locale?: Locale;
}) {
  const t = getTranslator(locale);
  const href = `/etkinlikler/${event.slug}`;
  const start = event.startsAt ? new Date(event.startsAt) : null;
  const end = event.endsAt ? new Date(event.endsAt) : null;
  const closed = ["cancelled", "ended"].includes(event.displayStatus);
  const startDateLabel = start
    ? formatDate(start, locale, {
        day: "numeric",
        month: "long",
        weekday: "long",
      })
    : "";
  const startDayLabel = start
    ? formatDate(start, locale, { day: "numeric", month: "long" })
    : "";
  const endDayLabel = end
    ? formatDate(end, locale, { day: "numeric", month: "long" })
    : "";
  return (
    <article
      className="coffee-talk-card event-feature-card"
      aria-label={event.title}
    >
      <Link
        className="coffee-talk-poster event-feature-poster"
        href={href}
        aria-label={t("events.eventDetailsAria", { title: event.title })}
      >
        {event.image ? (
          <Image
            unoptimized
            src={`/media/${event.image.id}`}
            alt={event.image.altText}
            width={event.image.width}
            height={event.image.height}
          />
        ) : (
          <span aria-hidden="true">
            {t("events.posterFallbackLine1")}
            <br />
            {t("events.posterFallbackLine2")}
          </span>
        )}
      </Link>
      <div className="coffee-talk-info event-feature-info">
        <p className="eyebrow">
          {event.displayStatus === "cancelled"
            ? t("events.statusCancelled")
            : event.displayStatus === "ended"
              ? t("events.statusEnded")
              : t("events.communityMeetupEyebrow")}
        </p>
        <h2>
          <Link href={href}>{event.title}</Link>
        </h2>
        {event.excerpt && <p className="lede">{event.excerpt}</p>}
        {event.description && <p>{event.description}</p>}
        <dl>
          {start && (
            <div>
              <dt>{t("common.dateLabel")}</dt>
              <dd>{startDateLabel}</dd>
            </div>
          )}
          {start && (
            <div>
              <dt>{t("common.timeLabel")}</dt>
              <dd>
                {formatTime(start, locale)}
                {end
                  ? `–${startDayLabel === endDayLabel ? "" : `${endDayLabel} `}${formatTime(end, locale)}`
                  : ""}
              </dd>
            </div>
          )}
          {event.location && (
            <div>
              <dt>{t("common.venueLabel")}</dt>
              <dd>{event.location}</dd>
            </div>
          )}
        </dl>
        <div className="event-feature-actions">
          {!closed && event.applicationUrl && (
            <Link className="button" href={event.applicationUrl}>
              {t("common.apply")}
            </Link>
          )}
          <Link href={href}>
            {t("events.inspectEventLink")} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
