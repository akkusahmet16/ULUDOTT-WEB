import Image from "next/image";
import { DEFAULT_LOCALE, type Locale } from "../../../i18n/config.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import { degreeGames } from "../domain/degree-games";
import type { HistoricalResult } from "../domain/historical-result";
import type { ManualGame } from "../../site-settings/domain/homepage";
import type { ArchiveGame } from "../../site-settings/domain/archives";
import { sanitizeMediaSrc } from "../../media/domain/sanitize-src";

export function DegreeGames({
  results,
  customGames,
  archiveGames,
  year = 2026,
  locale = DEFAULT_LOCALE,
}: {
  results?: readonly HistoricalResult[];
  customGames?: readonly ManualGame[];
  archiveGames?: readonly ArchiveGame[];
  year?: number;
  locale?: Locale;
}) {
  const t = getTranslator(locale);

  if (customGames && customGames.length > 0) {
    return (
      <div className="grid degree-games">
        {customGames.map((game, index) => (
          <article className="degree-game-card" key={game.id || index}>
            <Image
              src={sanitizeMediaSrc(
                game.image,
                "/community/06-oyunlar/derece-oyunlari-kapak.webp",
              )}
              alt={game.title}
              width={1600}
              height={900}
              sizes="(max-width: 699px) 100vw, 33vw"
            />
            <p className="eyebrow">{game.team || t("home.createTogetherEyebrow")}</p>
            <h3>{game.title}</h3>
            {game.description && (
              <p style={{ fontSize: "14px", color: "var(--muted)", margin: "4px 0" }}>
                {game.description}
              </p>
            )}
            {game.itchUrl ? (
              <a href={game.itchUrl} target="_blank" rel="noopener noreferrer">
                {t("ulujam.openGameOnItch", { title: game.title })}
              </a>
            ) : null}
          </article>
        ))}
      </div>
    );
  }

  if (archiveGames && archiveGames.length > 0) {
    return (
      <div className="grid degree-games">
        {[...archiveGames]
          .sort((a, b) => a.rank - b.rank)
          .map((game) => (
            <article className="degree-game-card" key={game.rank}>
              <Image
                src={sanitizeMediaSrc(
                  game.image,
                  "/community/06-oyunlar/derece-oyunlari-kapak.webp",
                )}
                alt={game.title}
                width={1600}
                height={900}
                sizes="(max-width: 699px) 100vw, 33vw"
              />
              <p className="eyebrow">
                {t("ulujam.heading", { year })} · {t("ulujam.rankBadge", { rank: game.rank })}
              </p>
              <h3>{game.title}</h3>
              {game.team && (
                <p style={{ fontSize: "14px", color: "var(--muted)", margin: "2px 0" }}>
                  {game.team}
                </p>
              )}
              {game.description && (
                <p style={{ fontSize: "14px", color: "var(--muted)", margin: "4px 0" }}>
                  {game.description}
                </p>
              )}
              {game.itchUrl ? (
                <a href={game.itchUrl} target="_blank" rel="noopener noreferrer">
                  {t("ulujam.openGameOnItch", { title: game.title })}
                </a>
              ) : null}
            </article>
          ))}
      </div>
    );
  }

  return (
    <div className="grid degree-games">
      {(results || []).map((result) => {
        const game = degreeGames[result.rank - 1];
        if (!game) return null;
        return (
          <article className="degree-game-card" key={result.id}>
            <Image
              src={sanitizeMediaSrc(
                game.image,
                "/community/06-oyunlar/derece-oyunlari-kapak.webp",
              )}
              alt={game.title}
              width={1600}
              height={900}
              sizes="(max-width: 699px) 100vw, 33vw"
            />
            <p className="eyebrow">
              {t("ulujam.heading", { year })} · {t("ulujam.rankBadge", { rank: result.rank })}
            </p>
            <h3>{game.title}</h3>
            {result.itchUrl ? (
              <a href={result.itchUrl} target="_blank" rel="noopener noreferrer">
                {t("ulujam.openGameOnItch", { title: game.title })}
              </a>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
