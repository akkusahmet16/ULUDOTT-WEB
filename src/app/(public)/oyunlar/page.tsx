import Link from "next/link";
import { listPublicGames } from "../../../modules/games/infrastructure/game-repository";
import { PublicShell } from "../../../components/layout/public-shell";
import { listPublicHistoricalResults } from "../../../modules/games/application/historical-results";
import { ResultCard } from "../../../modules/games/ui/result-card";
import Image from "next/image";
import { degreeGames } from "../../../modules/games/domain/degree-games";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Oyunlar — Uludott",
  description: "UluJam 2026'nın doğrulanmış derece ve itch.io bağlantıları.",
};
const publishedGames = [
  {
    title: "No Time To Die",
    label: "Yayımlanmış oyun",
    image: "/community/06-oyunlar/yayimlanan/no-time-to-die.webp",
    href: "https://altay434.itch.io/no-time-to-die",
    credit: "Altay Turan · Headlong",
  },
  {
    title: "InFrame",
    label: "UluJam 2025 · 2. derece",
    image: "/community/06-oyunlar/yayimlanan/inframe.webp",
    href: "https://farukb.itch.io/inframe",
    credit: "Team Vazos",
  },
] as const;
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
            <div className="grid degree-games">
              {results.map((result, index) => {
                const game = degreeGames[index];
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
                    <a
                      href={result.itchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {game.title} oyununu itch.io’da aç
                    </a>
                  </article>
                );
              })}
            </div>
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
            {publishedGames.map((game) => (
              <a
                className="published-game-card"
                href={game.href}
                key={game.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={game.image}
                  alt={game.title}
                  width={1600}
                  height={900}
                  sizes="(max-width: 699px) 100vw, 50vw"
                />
                <span className="published-game-copy">
                  <span className="eyebrow">{game.label}</span>
                  <strong>{game.title}</strong>
                  <span>{game.credit}</span>
                  <span className="published-game-link">itch.io ↗</span>
                </span>
              </a>
            ))}
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
