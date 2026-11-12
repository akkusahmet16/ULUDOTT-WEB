import Link from "next/link";
import { getLocale } from "../../../i18n/server.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import { buildMetadata } from "../../../seo/build-metadata.ts";
import { getSozlukRequestContext } from "../../../modules/sozluk/application/sozluk-request-context.ts";
import {
  getSozlukSidebarData,
  getSozlukTopicPage,
} from "../../../modules/sozluk/application/sozluk-service.ts";
import { SozlukEntryComposer } from "../../../modules/sozluk/ui/entry-composer.tsx";
import { SozlukFeed } from "../../../modules/sozluk/ui/sozluk-feed.tsx";
import { sozlukHref } from "../../../modules/sozluk/ui/sozluk-links.ts";
import { SozlukShell } from "../../../modules/sozluk/ui/sozluk-shell.tsx";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const data = await getSozlukTopicPage(slug, { filter: "all", page: 1 });
  return buildMetadata({
    routeId: "sozlukTopic",
    locale,
    params: { slug },
    content: data ? { title: data.topic.title } : { notFound: true },
  });
}

export default async function SozlukTopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ a?: string; p?: string }>;
}) {
  const [{ slug }, query, locale, ctx] = await Promise.all([
    params,
    searchParams,
    getLocale(),
    getSozlukRequestContext(),
  ]);
  const t = getTranslator(locale);
  const filter =
    query.a === "sukela" ? "sukela" : query.a === "today" ? "today" : "all";
  const page = Number.parseInt(query.p ?? "1", 10) || 1;

  const [sidebar, data] = await Promise.all([
    getSozlukSidebarData({ mode: "gundem" }),
    getSozlukTopicPage(slug, {
      filter,
      page,
      viewerAuthorId: ctx.viewer?.id,
    }),
  ]);

  if (!data) {
    return (
      <SozlukShell
        isSubdomain={ctx.isSubdomain}
        viewer={ctx.viewer}
        channels={sidebar.channels}
        topics={sidebar.topics}
        activeMode="gundem"
      >
        <div className="sozluk-topic-header">
          <h1 className="sozluk-topic-title">{t("sozluk.topicNotFoundTitle")}</h1>
          <p className="sozluk-count-badge">{t("sozluk.topicNotFoundHint")}</p>
        </div>
      </SozlukShell>
    );
  }

  const items = data.entries.map((item) => ({
    id: item.entry.id,
    content: item.entry.content,
    upvotes: item.entry.upvotes,
    downvotes: item.entry.downvotes,
    favoritesCount: item.entry.favoritesCount,
    createdAt: item.entry.createdAt.toISOString(),
    editedAt: item.entry.editedAt ? item.entry.editedAt.toISOString() : null,
    author: item.author,
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
        <h1 className="sozluk-topic-title">{data.topic.title}</h1>
        <div className="sozluk-filter-row">
          <Link
            href={sozlukHref(`/${slug}`, ctx.isSubdomain)}
            className="sozluk-subnav-link"
            data-active={filter === "all"}
          >
            {t("sozluk.filterAll")}
          </Link>
          <Link
            href={sozlukHref(`/${slug}?a=sukela`, ctx.isSubdomain)}
            className="sozluk-subnav-link"
            data-active={filter === "sukela"}
          >
            {t("sozluk.filterSukela")}
          </Link>
          <Link
            href={sozlukHref(`/${slug}?a=today`, ctx.isSubdomain)}
            className="sozluk-subnav-link"
            data-active={filter === "today"}
          >
            {t("sozluk.filterToday")}
          </Link>
          {data.channel && (
            <span className="sozluk-count-badge">{`#${data.channel.slug}`}</span>
          )}
        </div>
      </div>

      <SozlukFeed
        items={items}
        viewerAuthorId={ctx.viewer?.id}
        viewerRank={ctx.viewer?.rank}
        isSubdomain={ctx.isSubdomain}
        emptyKey="sozluk.emptyFeed"
      />

      {data.totalPages > 1 && (
        <div className="sozluk-pagination">
          {data.page > 1 && (
            <Link
              href={sozlukHref(
                `/${slug}?a=${filter}&p=${data.page - 1}`,
                ctx.isSubdomain,
              )}
              className="sozluk-btn"
            >
              {t("sozluk.prevPage")}
            </Link>
          )}
          <span className="sozluk-count-badge">
            {`${data.page} / ${data.totalPages}`}
          </span>
          {data.page < data.totalPages && (
            <Link
              href={sozlukHref(
                `/${slug}?a=${filter}&p=${data.page + 1}`,
                ctx.isSubdomain,
              )}
              className="sozluk-btn"
            >
              {t("sozluk.nextPage")}
            </Link>
          )}
        </div>
      )}

      <SozlukEntryComposer
        topicSlug={data.topic.slug}
        isLocked={data.topic.isLocked}
        hasViewer={Boolean(ctx.viewer)}
      />
    </SozlukShell>
  );
}
