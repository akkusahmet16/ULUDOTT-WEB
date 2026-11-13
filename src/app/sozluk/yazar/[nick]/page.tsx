import { notFound } from "next/navigation";
import { getLocale } from "../../../../i18n/server.ts";
import { getTranslator } from "../../../../i18n/translate.ts";
import { buildMetadata } from "../../../../seo/build-metadata.ts";
import { getSozlukRequestContext } from "../../../../modules/sozluk/application/sozluk-request-context.ts";
import { getSozlukAuthorPage } from "../../../../modules/sozluk/application/sozluk-service.ts";
import { SozlukFeed } from "../../../../modules/sozluk/ui/sozluk-feed.tsx";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nick: string }>;
}) {
  const [{ nick }, locale] = await Promise.all([params, getLocale()]);
  const data = await getSozlukAuthorPage(nick);
  return buildMetadata({
    routeId: "sozlukAuthor",
    locale,
    params: { nick },
    content: data ? { title: data.author.nick } : { notFound: true },
  });
}

export default async function SozlukAuthorPage({
  params,
}: {
  params: Promise<{ nick: string }>;
}) {
  const [{ nick }, locale, ctx] = await Promise.all([
    params,
    getLocale(),
    getSozlukRequestContext(),
  ]);
  const t = getTranslator(locale);
  const data = await getSozlukAuthorPage(nick, ctx.viewer?.id);

  if (!data) notFound();

  const items = data.entries.map((item) => ({
    id: item.entry.id,
    content: item.entry.content,
    upvotes: item.entry.upvotes,
    downvotes: item.entry.downvotes,
    favoritesCount: item.entry.favoritesCount,
    createdAt: item.entry.createdAt.toISOString(),
    editedAt: item.entry.editedAt ? item.entry.editedAt.toISOString() : null,
    author: {
      id: data.author.id,
      nick: data.author.nick,
      rank: data.author.rank,
    },
    topic: { slug: item.topic.slug, title: item.topic.title },
    viewerVote: item.viewerVote,
    viewerFavorited: item.viewerFavorited,
  }));

  return (
    <section>
      <header className="sozluk-profile-header">
        <div className="sozluk-profile-avatar" aria-hidden="true">
          {data.author.nick.slice(0, 1)}
        </div>
        <div className="sozluk-profile-info">
          <h1 className="sozluk-topic-title">{data.author.nick}</h1>
          <div className="sozluk-profile-stats">
            <span className="sozluk-rank-chip">{data.author.rank}</span>
            <span>
              <strong>{data.entryCount}</strong> {t("sozluk.profileEntriesCount")}
            </span>
            <span>
              <strong>{data.totalUpvotes}</strong> {t("sozluk.profileSukelaCount")}
            </span>
          </div>
          {data.author.bio && <p className="sozluk-profile-bio">{data.author.bio}</p>}
        </div>
      </header>

      <SozlukFeed
        items={items}
        viewerAuthorId={ctx.viewer?.id}
        viewerRank={ctx.viewer?.rank}
        isSubdomain={ctx.isSubdomain}
        emptyKey="sozluk.profileNoEntries"
      />
    </section>
  );
}
