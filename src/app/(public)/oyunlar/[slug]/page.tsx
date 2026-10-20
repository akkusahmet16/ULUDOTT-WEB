import { notFound } from "next/navigation";
import { PublicShell } from "../../../../components/layout/public-shell";
import { readPublicGame } from "../../../../modules/publication/ui/public-queries";
import { PublicGame } from "../../../../modules/games/ui/public-game";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const g = await readPublicGame((await params).slug);
  if (!g) return { title: "Oyun bulunamadı — Uludott", robots: { index: false, follow: false } };
  return {
    title: g.title + " — Uludott",
    alternates: { canonical: `/oyunlar/${g.slug}` },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const g = await readPublicGame((await params).slug);
  if (!g) notFound();
  return (
    <PublicShell>
      <PublicGame game={g} />
    </PublicShell>
  );
}
