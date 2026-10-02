import Image from "next/image";
import type { PublicGameView } from "../infrastructure/game-repository";
export function PublicGame({ game }: { game: PublicGameView }) {
  return (
    <article className="section" aria-label={game.title}>
      <p className="eyebrow">
        {game.eventTitle}
        {game.rank ? " · " + game.rank + ". derece" : ""}
        {game.finalist ? " · Finalist" : ""}
      </p>
      <h1>{game.title}</h1>
      {game.image && (
        <Image
          src={game.image.url}
          alt={game.image.alt}
          width={900}
          height={600}
          unoptimized
          style={{ maxWidth: "100%", height: "auto", objectFit: "contain" }}
        />
      )}
      <h2>{game.teamName}</h2>
      <p style={{ whiteSpace: "pre-wrap" }}>{game.description}</p>
      <p>Yapımcılar: {game.credits.join(" · ")}</p>
      <a href={game.itchUrl} target="_blank" rel="noopener noreferrer external">
        Oyunu itch.io’da aç (yeni sekmede)
      </a>
    </article>
  );
}
