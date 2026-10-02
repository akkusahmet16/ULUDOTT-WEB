import Link from "next/link";
import type { PublicGameView } from "../infrastructure/game-repository";
import { ResultCard } from "./result-card";
export function FinalistList({
  items = [],
  nextCursor = null,
}: {
  items?: PublicGameView[];
  nextCursor?: string | null;
}) {
  return (
    <section id="finalist-oyunlari" aria-label="Finalist oyunları">
      <h3>Finalistler</h3>
      {items.length ? (
        <div className="grid">
          {items.map((g) => (
            <ResultCard key={g.id} result={g} />
          ))}
        </div>
      ) : (
        <p className="empty">Finalist oyunları henüz yayımlanmadı.</p>
      )}
      {nextCursor && (
        <Link
          href={"/ulujam?finalistCursor=" + nextCursor + "#finalist-oyunlari"}
        >
          Sonraki finalistler
        </Link>
      )}
    </section>
  );
}
