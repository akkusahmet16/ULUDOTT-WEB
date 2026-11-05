import Image from "next/image";
import { DEFAULT_LOCALE, type Locale } from "../../../i18n/config.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import type { SiteGameFields } from "../domain/site-games";
export function SiteGameCard({
  game,
  locale = DEFAULT_LOCALE,
}: {
  game: SiteGameFields;
  locale?: Locale;
}) {
  const t = getTranslator(locale);
  return (
    <a
      className="published-game-card"
      href={game.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Image
        src={game.image}
        alt={game.alt}
        width={1600}
        height={900}
        sizes="(max-width: 699px) 100vw, 50vw"
        unoptimized
      />
      <span className="published-game-copy">
        <span className="eyebrow">{game.label}</span>
        <strong>{game.title}</strong>
        <span>{game.credit}</span>
        {game.description && <span>{game.description}</span>}
        <span className="published-game-link">{t("common.itchIoExternal")}</span>
      </span>
    </a>
  );
}
