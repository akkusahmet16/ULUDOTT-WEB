import { notFound } from "next/navigation";
import { PublicShell } from "../../../../components/layout/public-shell";
import { readPublicGame } from "../../../../modules/publication/ui/public-queries";
import { PublicGame } from "../../../../modules/games/ui/public-game";
import { buildMetadata } from "../../../../seo/build-metadata.ts";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const g = await readPublicGame(slug);
  if (!g) {
    return buildMetadata({
      routeId: "gameDetail",
      params: { slug },
      content: { notFound: true },
    });
  }
  return buildMetadata({
    routeId: "gameDetail",
    params: { slug: g.slug },
    content: {
      title: g.title,
      description: g.description,
    },
  });
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
