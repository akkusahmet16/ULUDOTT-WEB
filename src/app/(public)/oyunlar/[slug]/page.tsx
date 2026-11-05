import { notFound } from "next/navigation";
import { PublicShell } from "../../../../components/layout/public-shell";
import { readPublicGame } from "../../../../modules/publication/ui/public-queries";
import { PublicGame } from "../../../../modules/games/ui/public-game";
import { getLocale } from "../../../../i18n/server.ts";
import { buildMetadata } from "../../../../seo/build-metadata.ts";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const g = await readPublicGame(slug);
  if (!g) {
    return buildMetadata({
      routeId: "gameDetail",
      locale,
      params: { slug },
      content: { notFound: true },
    });
  }
  return buildMetadata({
    routeId: "gameDetail",
    locale,
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
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const g = await readPublicGame(slug);
  if (!g) notFound();
  return (
    <PublicShell>
      <PublicGame game={g} locale={locale} />
    </PublicShell>
  );
}
