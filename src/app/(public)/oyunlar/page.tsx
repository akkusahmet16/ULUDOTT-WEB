import Link from "next/link";
import { PublicShell } from "../../../components/layout/public-shell";
import {
  readHistoricalResults,
  readPublicGames,
  readPublishedSiteGames,
} from "../../../modules/publication/ui/public-queries";
import { ResultCard } from "../../../modules/games/ui/result-card";
import { SiteGameCard } from "../../../modules/games/ui/site-game-card";
import { DegreeGames } from "../../../modules/games/ui/degree-games";
import { getLocale } from "../../../i18n/server.ts";
import { buildMetadata } from "../../../seo/build-metadata.ts";
export async function generateMetadata() {
  return buildMetadata({ routeId: "games", locale: await getLocale() });
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { cursor } = await searchParams;
  const [results, full, publishedGames] = await Promise.all([
    readHistoricalResults(2026),
    readPublicGames(cursor),
    readPublishedSiteGames(),
  ]);
  return (
    <PublicShell>
      <section className="section">
        <p className="eyebrow">UluJam oyunları</p>
        <h1>Oyunlar</h1>
        <p className="lede">Topluluğun ürettiği oyunlara açılan kapı.</p>
        <section
          id="derece-oyunlari"
          aria-label="UluJam 2026 sonuçları"
          className="section"
        >
          <h2>UluJam 2026</h2>
          <p>
            Doğrulanmış ilk üç derece ve oyun bağlantısı. Diğer bilgiler
            editoryal onaydan sonra eklenecek.
          </p>
          {results.length ? (
            <DegreeGames results={results} />
          ) : (
            <p className="empty">Henüz yayımlanmış derece bağlantısı yok.</p>
          )}
        </section>
        <section
          id="yayinlanan-oyunlar"
          aria-label="Yayımlanmış oyunlar"
          className="section"
        >
          <h2>Yayımlanmış oyunlar ve finalistler</h2>
          <div className="published-games">
            {publishedGames.map((game) => <SiteGameCard key={game.id} game={game} />)}
          </div>
          {full.items.length ? (
            <div className="grid">
              {full.items.map((g) => (
                <ResultCard key={g.id} result={g} />
              ))}
            </div>
          ) : null}
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
