import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getPublicAnnouncement } from "../../../../modules/announcements/application/announcement-service";
import { PublicShell } from "../../../../components/layout/public-shell";
import { ContentView } from "../../../../modules/publication/ui/content-view";
import { loadServerConfig } from "../../../../lib/config/server";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getPublicAnnouncement((await params).slug);
  if (!item) return { robots: { index: false, follow: false } };
  const url = new URL(
    `/duyurular/${item.slug}`,
    loadServerConfig().appUrl,
  ).toString();
  const title = item.seo.title || item.title,
    description = item.seo.description || item.excerpt || undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: item.image
        ? [
            {
              url: new URL(`/media/${item.image.id}`, url).toString(),
              alt: item.image.altText,
              width: item.image.width,
              height: item.image.height,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: item.image
        ? [new URL(`/media/${item.image.id}`, url).toString()]
        : [],
    },
  };
}
export default async function Page({ params }: Props) {
  const item = await getPublicAnnouncement((await params).slug);
  if (!item) notFound();
  if (item.redirectSlug) permanentRedirect(`/duyurular/${item.redirectSlug}`);
  return (
    <PublicShell>
      <section className="section">
        <ContentView item={item} type="announcement" />
      </section>
    </PublicShell>
  );
}
