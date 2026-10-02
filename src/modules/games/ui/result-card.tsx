import type { HistoricalResult } from "../domain/historical-result";
export function ResultCard({ result }: { result: HistoricalResult }) {
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
