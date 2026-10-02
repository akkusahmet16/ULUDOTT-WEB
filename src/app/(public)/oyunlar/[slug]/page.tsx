import { notFound } from "next/navigation";
import { PublicShell } from "../../../../components/layout/public-shell";
import { getPublicGame } from "../../../../modules/games/infrastructure/game-repository";
import { PublicGame } from "../../../../modules/games/ui/public-game";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const g = await getPublicGame((await params).slug);
  return { title: g ? g.title + " — Uludott" : "Oyun bulunamadı — Uludott" };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const g = await getPublicGame((await params).slug);
  if (!g) notFound();
  return (
    <PublicShell>
      <PublicGame game={g} />
    </PublicShell>
  );
}
