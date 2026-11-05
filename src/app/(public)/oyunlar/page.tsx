import Link from "next/link";
import { PublicShell } from "../../../components/layout/public-shell";
import {
  readHistoricalResults,
  readPublicGames,
  readPublishedSiteGames,
} from "../../../modules/publication/ui/public-queries";
import { ResultCard } from "../../../modules/games/ui/result-card";
import { SiteGameCard } from "../../../modules/games/ui/site-game-card";
import { DegreeGames } from "../../../modules/games/ui/degree-games";
import { getLocale } from "../../../i18n/server.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import { buildMetadata } from "../../../seo/build-metadata.ts";
export async function generateMetadata() {
  return buildMetadata({ routeId: "games", locale: await getLocale() });
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const [{ cursor }, locale] = await Promise.all([searchParams, getLocale()]);
  const t = getTranslator(locale);
  const [results, full, publishedGames] = await Promise.all([
    readHistoricalResults(2026),
    readPublicGames(cursor),
    readPublishedSiteGames(),
  ]);
  return (
    <PublicShell>
      <section className="section">
        <p className="eyebrow">{t("games.eyebrow")}</p>
        <h1>{t("games.heading")}</h1>
        <p className="lede">{t("games.lede")}</p>
        <section
          id="derece-oyunlari"
          aria-label={t("games.degreesSectionAria")}
          className="section"
        >
          <h2>{t("games.degreesSectionHeading")}</h2>
          <p>{t("games.degreesSectionCopy")}</p>
          {results.length ? (
            <DegreeGames results={results} locale={locale} />
          ) : (
            <p className="empty">{t("ulujam.degreeEmpty")}</p>
          )}
        </section>
        <section
          id="yayinlanan-oyunlar"
          aria-label={t("games.publishedSectionAria")}
          className="section"
        >
          <h2>{t("games.publishedSectionHeading")}</h2>
          <div className="published-games">
            {publishedGames.map((game) => (
              <SiteGameCard key={game.id} game={game} locale={locale} />
            ))}
          </div>
          {full.items.length ? (
            <div className="grid">
              {full.items.map((g) => (
                <ResultCard key={g.id} result={g} locale={locale} />
              ))}
            </div>
          ) : null}
          {full.nextCursor && (
            <p>
              <Link href={"/oyunlar?cursor=" + full.nextCursor}>
                {t("games.nextGamesLink")}
              </Link>
            </p>
          )}
          {cursor && (
            <p>
              <Link href="/oyunlar">{t("games.firstGamesPageLink")}</Link>
            </p>
          )}
        </section>
      </section>
    </PublicShell>
  );
}
