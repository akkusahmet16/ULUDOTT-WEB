import {
  listPublicGames,
  getPublicGameById,
} from "../../../modules/games/infrastructure/game-repository";
import { historical2026 } from "../../../modules/games/domain/historical-result";
import { PublicShell } from "../../../components/layout/public-shell";
import {
  publishedYearStart,
  galleryImages,
} from "../../../modules/events/application/ulujam-service";
import { UlujamComingSoon } from "../../../modules/events/ui/ulujam-coming-soon";
import { UlujamArchive } from "../../../modules/events/ui/ulujam-archive";
import { listPublicHistoricalResults } from "../../../modules/games/application/historical-results";
import { StarCatch } from "../../../modules/community/star-catch";
import { PairMatch } from "../../../modules/community/pair-match";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "UluJam — Uludott",
  description: "UluJam 2026 arşivi, oyun sonuçları ve 2027 duyuruları.",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ finalistCursor?: string }>;
}) {
  const { finalistCursor } = await searchParams;
  const [startAt, results, gallery, full, finalists] = await Promise.all([
    publishedYearStart(2027),
    listPublicHistoricalResults(2026),
    galleryImages(2026),
    Promise.all(historical2026.results.map((g) => getPublicGameById(g.id))),
    listPublicGames({
      eventId: historical2026.eventId,
      finalistOnly: true,
      cursor: finalistCursor,
    }),
  ]);
  return (
    <PublicShell>
      <UlujamComingSoon year={2027} startAt={startAt} />
      <UlujamArchive
        year={2026}
        results={results.map((r) => full.find((g) => g?.id === r.id) ?? r)}
        gallery={gallery}
        finalists={finalists.items}
        nextFinalistCursor={finalists.nextCursor}
      />
      <section className="section" aria-label="Mini oyunlar">
        <h2>Kısa bir oyun molası</h2>
        <p>İsteğe bağlı oyunlar. Puanlar bu sayfada kalır; kaydedilmez.</p>
        <div className="grid">
          <StarCatch />
          <PairMatch />
        </div>
      </section>
    </PublicShell>
  );
}
