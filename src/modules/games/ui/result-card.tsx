import Link from "next/link";
import { DEFAULT_LOCALE, type Locale } from "../../../i18n/config.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import type { PublicGameView } from "../infrastructure/game-repository";
import type { HistoricalResult } from "../domain/historical-result";
export function ResultCard({
  result,
  locale = DEFAULT_LOCALE,
}: {
  result: HistoricalResult | PublicGameView;
  locale?: Locale;
}) {
  const t = getTranslator(locale);
  if ("slug" in result)
    return (
      <article className="card">
        <p className="eyebrow">
          {result.rank
            ? t("ulujam.rankBadge", { rank: result.rank })
            : result.finalist
              ? t("games.finalistBadge")
              : t("games.ulujamGameBadge")}
        </p>
        <h3>{result.title}</h3>
        <p>{result.teamName}</p>
        <p>
          {t("games.creditsPrefix", {
            credits: result.credits.join(" · "),
          })}
        </p>
        <Link href={"/oyunlar/" + result.slug}>
          {t("games.gameDetailsLink")}
        </Link>
      </article>
    );
  return (
    <article className="card">
      <p className="eyebrow">{t("games.partialEditorialBadge")}</p>
      <h3>{t("ulujam.rankBadge", { rank: result.rank })}</h3>
      <p>{t("games.partialEditorialCopy")}</p>
      <a
        href={result.itchUrl}
        target="_blank"
        rel="noopener noreferrer external"
      >
        {t("games.openRankOnItch", { rank: result.rank })}
        <span>{t("common.newTabSuffix")}</span>
      </a>
    </article>
  );
}
