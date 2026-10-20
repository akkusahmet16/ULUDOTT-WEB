import Image from "next/image";
import { degreeGames } from "../domain/degree-games";
import type { HistoricalResult } from "../domain/historical-result";

export function DegreeGames({
  results,
}: {
  results: readonly HistoricalResult[];
}) {
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
            <p className="eyebrow">{result.rank}. derece</p>
            <h3>{game.title}</h3>
            <a href={result.itchUrl} target="_blank" rel="noopener noreferrer">
              {game.title} oyununu itch.io’da aç
            </a>
          </article>
        );
      })}
    </div>
  );
}
