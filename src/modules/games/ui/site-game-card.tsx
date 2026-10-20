import Image from "next/image";
import type { SiteGameFields } from "../domain/site-games";
export function SiteGameCard({ game }: { game: SiteGameFields }) {
  return (
    <a
      className="published-game-card"
      href={game.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Image
        src={game.image}
        alt={game.alt}
        width={1600}
        height={900}
        sizes="(max-width: 699px) 100vw, 50vw"
        unoptimized
      />
      <span className="published-game-copy">
        <span className="eyebrow">{game.label}</span>
        <strong>{game.title}</strong>
        <span>{game.credit}</span>
        {game.description && <span>{game.description}</span>}
        <span className="published-game-link">itch.io ↗</span>
      </span>
    </a>
  );
}
