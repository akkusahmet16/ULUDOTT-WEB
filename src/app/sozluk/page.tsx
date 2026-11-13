import Link from "next/link";
import { getLocale } from "../../i18n/server.ts";
import { getTranslator } from "../../i18n/translate.ts";
import { buildMetadata } from "../../seo/build-metadata.ts";
import { getSozlukRequestContext } from "../../modules/sozluk/application/sozluk-request-context.ts";
import {
  getSozlukChannelTopics,
  getSozlukHomeFeed,
} from "../../modules/sozluk/application/sozluk-service.ts";
import { SozlukFeed } from "../../modules/sozluk/ui/sozluk-feed.tsx";
import { sozlukHref } from "../../modules/sozluk/ui/sozluk-links.ts";

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

  if (query.kanal) {
    const topics = await getSozlukChannelTopics(query.kanal);
    return (
      <section>
        <header className="sozluk-topic-header">
          <h1 className="sozluk-topic-title">{`#${query.kanal}`}</h1>
        </header>
        {topics.length > 0 ? (
          <ul className="sozluk-channel-list">
            {topics.map((topic) => (
              <li key={topic.id}>
                <Link
                  href={sozlukHref(`/${topic.slug}`, ctx.isSubdomain)}
                  className="sozluk-channel-item"
                >
                  <span>{topic.title}</span>
                  <small className="sozluk-count">{topic.entryCount}</small>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="sozluk-empty">{t("sozluk.channelTopicsEmpty")}</p>
        )}
      </section>
    );
  }

  const feed = await getSozlukHomeFeed(ctx.viewer?.id);
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
    <section>
      <header className="sozluk-topic-header">
        <h1 className="sozluk-topic-title">{t("sozluk.popularTitle")}</h1>
      </header>
      <SozlukFeed
        items={items}
        viewerAuthorId={ctx.viewer?.id}
        viewerRank={ctx.viewer?.rank}
        isSubdomain={ctx.isSubdomain}
        emptyKey="sozluk.emptyFeed"
      />
    </section>
  );
}
