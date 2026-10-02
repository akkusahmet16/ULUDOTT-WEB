import { PublicShell } from "../../../components/layout/public-shell";
import { listPublicHistoricalResults } from "../../../modules/games/application/historical-results";
import { ResultCard } from "../../../modules/games/ui/result-card";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Oyunlar — Uludott",
  description: "UluJam 2026'nın doğrulanmış derece ve itch.io bağlantıları.",
};
export default async function Page() {
  const results = await listPublicHistoricalResults(2026);
  return (
    <PublicShell>
      <section className="section">
        <p className="eyebrow">UluJam oyunları</p>
        <h1>Oyunlar</h1>
        <p className="lede">Topluluğun ürettiği oyunlara açılan kapı.</p>
        <section aria-label="UluJam 2026 sonuçları" className="section">
          <h2>UluJam 2026</h2>
          <p>
            Doğrulanmış ilk üç derece ve oyun bağlantısı. Diğer bilgiler
            editoryal onaydan sonra eklenecek.
          </p>
          {results.length ? (
            <div className="grid">
              {results.map((result) => (
                <ResultCard key={result.id} result={result} />
              ))}
            </div>
          ) : (
            <p className="empty">Henüz yayımlanmış derece bağlantısı yok.</p>
          )}
        </section>
      </section>
    </PublicShell>
  );
}
