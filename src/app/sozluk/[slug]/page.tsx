import Link from "next/link";
import { getLocale } from "../../../i18n/server.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import { buildMetadata } from "../../../seo/build-metadata.ts";
import { getSozlukRequestContext } from "../../../modules/sozluk/application/sozluk-request-context.ts";
import {
  getSozlukTopicPage,
  getSozlukTopicTitle,
} from "../../../modules/sozluk/application/sozluk-service.ts";
import { SozlukEntryComposer } from "../../../modules/sozluk/ui/entry-composer.tsx";
import { SozlukFeed } from "../../../modules/sozluk/ui/sozluk-feed.tsx";
import { sozlukHref } from "../../../modules/sozluk/ui/sozluk-links.ts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const topic = await getSozlukTopicTitle(slug);
  return buildMetadata({
    routeId: "sozlukTopic",
    locale,
    params: { slug },
    content: topic ? { title: topic.title } : { notFound: true },
  });
}

function Pager({
  slug,
  filter,
  page,
  totalPages,
  isSubdomain,
  prevLabel,
  nextLabel,
}: {
  slug: string;
  filter: string;
  page: number;
  totalPages: number;
  isSubdomain: boolean;
  prevLabel: string;
  nextLabel: string;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) =>
    sozlukHref(`/${slug}?a=${filter}&p=${p}`, isSubdomain);
  return (
    <nav className="sozluk-pager">
      {page > 1 ? (
        <Link href={href(page - 1)} className="sozluk-pager-btn" aria-label={prevLabel}>
          {"«"}
        </Link>
      ) : (
        <span className="sozluk-pager-btn" data-disabled="true">
          {"«"}
        </span>
      )}
      <span className="sozluk-pager-state">{`${page} / ${totalPages}`}</span>
      {page < totalPages ? (
        <Link href={href(page + 1)} className="sozluk-pager-btn" aria-label={nextLabel}>
          {"»"}
        </Link>
      ) : (
        <span className="sozluk-pager-btn" data-disabled="true">
          {"»"}
        </span>
      )}
    </nav>
  );
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

  const data = await getSozlukTopicPage(slug, {
    filter,
    page,
    viewerAuthorId: ctx.viewer?.id,
  });

  if (!data) {
    return (
      <section>
        <header className="sozluk-topic-header">
          <h1 className="sozluk-topic-title">{t("sozluk.topicNotFoundTitle")}</h1>
          <p className="sozluk-muted">{t("sozluk.topicNotFoundHint")}</p>
        </header>
      </section>
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

  const filters = [
    { key: "all", href: `/${slug}`, label: t("sozluk.filterAll") },
    { key: "sukela", href: `/${slug}?a=sukela`, label: t("sozluk.filterSukela") },
    { key: "today", href: `/${slug}?a=today`, label: t("sozluk.filterToday") },
  ] as const;

  const pager = (
    <Pager
      slug={slug}
      filter={filter}
      page={data.page}
      totalPages={data.totalPages}
      isSubdomain={ctx.isSubdomain}
      prevLabel={t("sozluk.prevPage")}
      nextLabel={t("sozluk.nextPage")}
    />
  );

  return (
    <section>
      <header className="sozluk-topic-header">
        <h1 className="sozluk-topic-title">
          <Link href={sozlukHref(`/${data.topic.slug}`, ctx.isSubdomain)}>
            {data.topic.title}
          </Link>
        </h1>
        <div className="sozluk-topic-toolbar">
          <div className="sozluk-filter-row">
            {filters.map((f) => (
              <Link
                key={f.key}
                href={sozlukHref(f.href, ctx.isSubdomain)}
                className="sozluk-filter-link"
                data-active={filter === f.key}
              >
                {f.label}
              </Link>
            ))}
            {data.channel && (
              <Link
                href={sozlukHref(`/?kanal=${data.channel.slug}`, ctx.isSubdomain)}
                className="sozluk-channel-chip"
              >
                {`#${data.channel.slug}`}
              </Link>
            )}
            <span className="sozluk-muted">
              {t("sozluk.topicEntryCount", { count: String(data.totalEntries) })}
            </span>
          </div>
          {pager}
        </div>
      </header>

      <SozlukFeed
        items={items}
        viewerAuthorId={ctx.viewer?.id}
        viewerRank={ctx.viewer?.rank}
        isSubdomain={ctx.isSubdomain}
        emptyKey="sozluk.emptyFeed"
        numberOffset={(data.page - 1) * 10}
      />

      <div className="sozluk-pager-bottom">{pager}</div>

      <SozlukEntryComposer
        topicSlug={data.topic.slug}
        isLocked={data.topic.isLocked}
        hasViewer={Boolean(ctx.viewer)}
      />
    </section>
  );
}
