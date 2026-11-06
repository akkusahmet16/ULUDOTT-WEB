import Image from "next/image";
import { DEFAULT_LOCALE, type Locale } from "../../../i18n/config.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import type { PublicContent } from "../../publication/domain.ts";
import styles from "./past-event-poster-card.module.css";

export type PastEventPosterCardProps = {
  event?: PublicContent;
  posterSrc?: string;
  alt?: string;
  title?: string;
  width?: number;
  height?: number;
  locale?: Locale;
};

export function PastEventPosterCard({
  event,
  posterSrc,
  alt,
  title,
  width,
  height,
  locale = DEFAULT_LOCALE,
}: PastEventPosterCardProps) {
  const t = getTranslator(locale);

  const cardTitle = title ?? event?.title ?? "";
  const imageSrc = posterSrc ?? (event?.image ? `/media/${event.image.id}` : null);
  const imageAlt = alt ?? event?.image?.altText ?? cardTitle;
  const imageWidth = width ?? event?.image?.width ?? 1080;
  const imageHeight = height ?? event?.image?.height ?? 1350;

  return (
    <article
      className={styles.posterCard}
      aria-label={cardTitle}
    >
      <div className={styles.posterFrame}>
        {imageSrc ? (
          <Image
            unoptimized
            src={imageSrc}
            alt={imageAlt}
            width={imageWidth}
            height={imageHeight}
            className={styles.posterImage}
          />
        ) : (
          <span className={styles.posterFallback} aria-hidden="true">
            {t("events.posterFallbackLine1")}
            <br />
            {t("events.posterFallbackLine2")}
          </span>
        )}
      </div>
    </article>
  );
}
