import Image from "next/image";
import { DEFAULT_LOCALE, type Locale } from "../../../i18n/config.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import type { PublicGameView } from "../infrastructure/game-repository";
export function PublicGame({
  game,
  locale = DEFAULT_LOCALE,
}: {
  game: PublicGameView;
  locale?: Locale;
}) {
  const t = getTranslator(locale);
  return (
    <article className="section" aria-label={game.title}>
      <p className="eyebrow">
        {game.eventTitle}
        {game.rank
          ? " · " + t("ulujam.rankBadge", { rank: game.rank })
          : ""}
        {game.finalist ? " · " + t("games.finalistBadge") : ""}
      </p>
      <h1>{game.title}</h1>
      {game.image && (
        <Image
          src={game.image.url}
          alt={game.image.alt}
          width={900}
          height={600}
          unoptimized
          style={{ maxWidth: "100%", height: "auto", objectFit: "contain" }}
        />
      )}
      <h2>{game.teamName}</h2>
      <p style={{ whiteSpace: "pre-wrap" }}>{game.description}</p>
      <p>
        {t("games.creditsPrefix", {
          credits: game.credits.join(" · "),
        })}
      </p>
      <a href={game.itchUrl} target="_blank" rel="noopener noreferrer external">
        {t("games.openOnItchNewTab")}
      </a>
    </article>
  );
}
