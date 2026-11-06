import Image from "next/image";
import { DEFAULT_LOCALE, type Locale } from "../../../i18n/config.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import { degreeGames } from "../domain/degree-games";
import type { HistoricalResult } from "../domain/historical-result";
import type { ManualGame } from "../../site-settings/domain/homepage";

export function DegreeGames({
  results,
  customGames,
  year = 2026,
  locale = DEFAULT_LOCALE,
}: {
  results?: readonly HistoricalResult[];
  customGames?: readonly ManualGame[];
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
              src={game.image}
              alt={game.title}
              width={1600}
              height={900}
              sizes="(max-width: 699px) 100vw, 33vw"
            />
            <p className="eyebrow">{game.team || "Topluluk Yapımı"}</p>
            <h3>{game.title}</h3>
            {game.description && (
              <p style={{ fontSize: "14px", color: "var(--muted)", margin: "4px 0" }}>
                {game.description}
              </p>
            )}
            <a href={game.itchUrl} target="_blank" rel="noopener noreferrer">
              {game.title} oyununu aç <span aria-hidden="true">↗</span>
            </a>
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
              src={game.image}
              alt={game.title}
              width={1600}
              height={900}
              sizes="(max-width: 699px) 100vw, 33vw"
            />
            <p className="eyebrow">
              {`UluJam ${year} · ${result.rank}. derece`}
            </p>
            <h3>{game.title}</h3>
            <a href={result.itchUrl} target="_blank" rel="noopener noreferrer">
              {t("ulujam.openGameOnItch", { title: game.title })}
            </a>
          </article>
        );
      })}
    </div>
  );
}
