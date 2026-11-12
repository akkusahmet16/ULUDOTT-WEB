import { getLocale } from "../../i18n/server.ts";
import { getTranslator } from "../../i18n/translate.ts";
import { buildMetadata } from "../../seo/build-metadata.ts";
import { getSozlukRequestContext } from "../../modules/sozluk/application/sozluk-request-context.ts";
import {
  getSozlukHomeFeed,
  getSozlukSidebarData,
} from "../../modules/sozluk/application/sozluk-service.ts";
import { SozlukFeed } from "../../modules/sozluk/ui/sozluk-feed.tsx";
import { SozlukShell } from "../../modules/sozluk/ui/sozluk-shell.tsx";

export async function generateMetadata() {
  return buildMetadata({ routeId: "sozluk", locale: await getLocale() });
}

export default async function SozlukHomePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; kanal?: string }>;
}) {
  const [locale, query, ctx] = await Promise.all([
    getLocale(),
    searchParams,
    getSozlukRequestContext(),
  ]);
  const t = getTranslator(locale);
  const mode =
    query.mode === "bugun"
      ? "bugun"
      : query.kanal
        ? "kanal"
        : "gundem";

  const [sidebar, feed] = await Promise.all([
    getSozlukSidebarData({ mode, channelSlug: query.kanal }),
    getSozlukHomeFeed(ctx.viewer?.id),
  ]);

  const items = feed.map((item) => ({
    id: item.entry.id,
    content: item.entry.content,
    upvotes: item.entry.upvotes,
    downvotes: item.entry.downvotes,
    favoritesCount: item.entry.favoritesCount,
    createdAt: item.entry.createdAt.toISOString(),
    editedAt: item.entry.editedAt ? item.entry.editedAt.toISOString() : null,
    author: item.author,
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
      activeChannelSlug={query.kanal}
      activeMode={mode}
    >
      <div className="sozluk-topic-header">
        <h1 className="sozluk-topic-title">{t("sozluk.popularTitle")}</h1>
      </div>
      <SozlukFeed
        items={items}
        viewerAuthorId={ctx.viewer?.id}
        viewerRank={ctx.viewer?.rank}
        isSubdomain={ctx.isSubdomain}
        emptyKey="sozluk.emptyFeed"
      />
    </SozlukShell>
  );
}
