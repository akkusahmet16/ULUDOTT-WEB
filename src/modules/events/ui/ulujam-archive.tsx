import Image from "next/image";
import { DEFAULT_LOCALE, type Locale } from "../../../i18n/config.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import type { ArchiveFields } from "../../site-settings/domain/archives";
import { sanitizeMediaSrc } from "../../media/domain/sanitize-src";
export function UlujamArchive({
  archive,
  locale = DEFAULT_LOCALE,
}: {
  archive: ArchiveFields;
  locale?: Locale;
}) {
  const t = getTranslator(locale);
  return (
    <section
      aria-label={t("ulujam.archiveAria", { year: archive.year })}
      className="section"
    >
      <h2>{t("ulujam.archiveHeading", { year: archive.year })}</h2>
      {archive.description && <p className="lede">{archive.description}</p>}
      <section aria-label={t("ulujam.archiveGalleryAria")}>
        <h3>{t("ulujam.archiveGalleryHeading")}</h3>
        {archive.gallery.length ? (
          <div className="archive-gallery-mosaic">
            {archive.gallery.map((image, index) => {
              const safeSrc = sanitizeMediaSrc(image.src);
              if (!safeSrc) return null;
              return (
                <figure
                  key={`${safeSrc}:${index}`}
                  className={`archive-gallery-item ${index === 0 ? "archive-gallery-featured" : "archive-gallery-side"}`}
                >
                  <Image
                    src={safeSrc}
                    alt={image.alt}
                    width={640}
                    height={480}
                    sizes={index === 0
                      ? "(max-width: 699px) 100vw, (max-width: 1500px) 67vw, 960px"
                      : "(max-width: 699px) 100vw, (max-width: 1500px) 33vw, 460px"}
                    className="event-cover"
                  />
                  <figcaption>
                    <span className="eyebrow">
                      {t("ulujam.heading", { year: archive.year })} /{" "}
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{image.alt}</span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        ) : (
          <p className="empty">{t("ulujam.archiveGalleryEmpty")}</p>
        )}
      </section>
      <h3 style={{ marginTop: "clamp(48px, 6vw, 84px)", marginBottom: "24px" }}>
        {t("ulujam.topThreeGamesHeading")}
      </h3>
      {archive.games.length ? (
        <div className="grid degree-games">
          {[...archive.games]
            .sort((a, b) => a.rank - b.rank)
            .map((game) => {
              const safeGameImage = sanitizeMediaSrc(
                game.image,
                "/community/06-oyunlar/derece-oyunlari-kapak.webp",
              );
              return (
                <article className="degree-game-card" key={game.rank}>
                  <Image
                    src={safeGameImage}
                    alt={game.title}
                    width={1600}
                    height={900}
                    sizes="(max-width: 699px) 100vw, (max-width: 1500px) 33vw, 470px"
                  />
                  <p className="eyebrow">
                    {t("ulujam.rankBadge", { rank: game.rank })}
                  </p>
                  <h3>{game.title}</h3>
                  {game.team && <p>{game.team}</p>}
                  {game.description && <p>{game.description}</p>}
                  <a
                    href={game.itchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("ulujam.openGameOnItch", { title: game.title })}
                  </a>
                </article>
              );
            })}
        </div>
      ) : (
        <p className="empty">{t("ulujam.degreeEmpty")}</p>
      )}
    </section>
  );
}
