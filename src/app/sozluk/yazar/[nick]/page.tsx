import { notFound } from "next/navigation";
import { getLocale } from "../../../../i18n/server.ts";
import { getTranslator } from "../../../../i18n/translate.ts";
import { buildMetadata } from "../../../../seo/build-metadata.ts";
import { getSozlukRequestContext } from "../../../../modules/sozluk/application/sozluk-request-context.ts";
import {
  getSozlukAuthorPage,
  getSozlukSidebarData,
} from "../../../../modules/sozluk/application/sozluk-service.ts";
import { SozlukFeed } from "../../../../modules/sozluk/ui/sozluk-feed.tsx";
import { SozlukShell } from "../../../../modules/sozluk/ui/sozluk-shell.tsx";

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
  const [sidebar, data] = await Promise.all([
    getSozlukSidebarData({ mode: "gundem" }),
    getSozlukAuthorPage(nick, ctx.viewer?.id),
  ]);

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
    <SozlukShell
      isSubdomain={ctx.isSubdomain}
      viewer={ctx.viewer}
      channels={sidebar.channels}
      topics={sidebar.topics}
      activeMode="gundem"
    >
      <div className="sozluk-topic-header">
        <h1 className="sozluk-topic-title">{`@${data.author.nick}`}</h1>
        <p className="sozluk-count-badge">
          {`${data.author.rank} · ${data.entryCount} ${t("sozluk.profileEntriesCount")} · ${data.totalUpvotes} ${t("sozluk.profileSukelaCount")}`}
        </p>
        {data.author.bio && <p>{data.author.bio}</p>}
      </div>

      <SozlukFeed
        items={items}
        viewerAuthorId={ctx.viewer?.id}
        viewerRank={ctx.viewer?.rank}
        isSubdomain={ctx.isSubdomain}
        emptyKey="sozluk.profileNoEntries"
      />
    </SozlukShell>
  );
}
