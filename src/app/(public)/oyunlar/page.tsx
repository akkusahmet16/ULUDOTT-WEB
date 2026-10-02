import Link from "next/link";
import { listPublicGames } from "../../../modules/games/infrastructure/game-repository";
import { PublicShell } from "../../../components/layout/public-shell";
import { listPublicHistoricalResults } from "../../../modules/games/application/historical-results";
import { ResultCard } from "../../../modules/games/ui/result-card";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Oyunlar — Uludott",
  description: "UluJam 2026'nın doğrulanmış derece ve itch.io bağlantıları.",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { cursor } = await searchParams;
  const [results, full] = await Promise.all([
    listPublicHistoricalResults(2026),
    listPublicGames({ cursor }),
  ]);
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
        <section aria-label="Yayımlanmış oyunlar" className="section">
          <h2>Yayımlanmış oyunlar ve finalistler</h2>
          {full.items.length ? (
            <div className="grid">
              {full.items.map((g) => (
                <ResultCard key={g.id} result={g} />
              ))}
            </div>
          ) : (
            <p className="empty">Henüz tam oyun kaydı yayımlanmadı.</p>
          )}
          {full.nextCursor && (
            <p>
              <Link href={"/oyunlar?cursor=" + full.nextCursor}>
                Sonraki oyunlar
              </Link>
            </p>
          )}
          {cursor && (
            <p>
              <Link href="/oyunlar">İlk oyun sayfasına dön</Link>
            </p>
          )}
        </section>
      </section>
    </PublicShell>
  );
}
