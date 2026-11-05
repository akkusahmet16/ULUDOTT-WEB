import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { readPublicEvent } from "../../../../modules/publication/ui/public-queries";
import { PublicShell } from "../../../../components/layout/public-shell";
import { ContentView } from "../../../../modules/publication/ui/content-view";
import { loadServerConfig } from "../../../../lib/config/server";
import { buildMetadata } from "../../../../seo/build-metadata.ts";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await readPublicEvent(slug);
  if (!item) {
    return buildMetadata({
      routeId: "eventDetail",
      params: { slug },
      content: { notFound: true },
    });
  }
  return buildMetadata({
    routeId: "eventDetail",
    params: { slug: item.slug },
    content: {
      title: item.seo.title || item.title,
      description: item.seo.description || item.excerpt || null,
      baseUrl: loadServerConfig().appUrl,
      includeSocialCards: true,
      image: item.image
        ? {
            id: item.image.id,
            altText: item.image.altText,
            width: item.image.width,
            height: item.image.height,
          }
        : null,
    },
  });
}
export default async function Page({ params }: Props) {
  const item = await readPublicEvent((await params).slug);
  if (!item) notFound();
  if (item.redirectSlug) permanentRedirect(`/etkinlikler/${item.redirectSlug}`);
  return (
    <PublicShell>
      <section className="section">
        <ContentView item={item} type="event" />
      </section>
    </PublicShell>
  );
}
