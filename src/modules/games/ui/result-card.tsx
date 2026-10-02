import Link from "next/link";
import type { PublicGameView } from "../infrastructure/game-repository";
import type { HistoricalResult } from "../domain/historical-result";
export function ResultCard({
  result,
}: {
  result: HistoricalResult | PublicGameView;
}) {
  if ("slug" in result)
    return (
      <article className="card">
        <p className="eyebrow">
          {result.rank
            ? `${result.rank}. derece`
            : result.finalist
              ? "Finalist"
              : "UluJam oyunu"}
        </p>
        <h3>{result.title}</h3>
        <p>{result.teamName}</p>
        <p>Yapımcılar: {result.credits.join(" · ")}</p>
        <Link href={"/oyunlar/" + result.slug}>Oyun ayrıntıları</Link>
      </article>
    );
  return (
    <article className="card">
      <p className="eyebrow">Kısmi editoryal kayıt</p>
      <h3>{result.rank}. derece</h3>
      <p>Oyun adı, takım, yapımcılar, görsel ve açıklama henüz yayımlanmadı.</p>
      <a
        href={result.itchUrl}
        target="_blank"
        rel="noopener noreferrer external"
      >
        {result.rank}. derece oyununu itch.io’da aç
        <span> (yeni sekmede)</span>
      </a>
    </article>
  );
}
