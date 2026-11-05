import Image from "next/image";
import { DEFAULT_LOCALE, type Locale } from "../../../i18n/config.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import { degreeGames } from "../domain/degree-games";
import type { HistoricalResult } from "../domain/historical-result";

export function DegreeGames({
  results,
  locale = DEFAULT_LOCALE,
}: {
  results: readonly HistoricalResult[];
  locale?: Locale;
}) {
  const t = getTranslator(locale);
  return (
    <div className="grid degree-games">
      {results.map((result) => {
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
              {t("ulujam.rankBadge", { rank: result.rank })}
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
