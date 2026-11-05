import Image from "next/image";
import { DEFAULT_LOCALE, type Locale } from "../../i18n/config.ts";
import { getTranslator } from "../../i18n/translate.ts";
export function SuppliedPoster({
  kind,
  locale = DEFAULT_LOCALE,
}: {
  kind: "event" | "announcement";
  locale?: Locale;
}) {
  const t = getTranslator(locale);
  const event = kind === "event";
  return (
    <figure
      className={`supplied-poster ${event ? "event-poster" : "announcement-poster"}`}
    >
      <Image
        src={
          event
            ? "/community/04-etkinlikler/etkinlik-coffe-talk/etkinlik-coffe-talk-afis.webp"
            : "/community/05-duyurular/duyuru-valorant/duyuru-valorant-afis.webp"
        }
        alt={
          event
            ? t("home.coffeeTalkPosterAlt")
            : t("home.suppliedAnnouncementPosterAlt")
        }
        width={1080}
        height={event ? 1350 : 1600}
        unoptimized
      />
      <figcaption>
        {event
          ? t("home.suppliedEventCaption")
          : t("home.suppliedAnnouncementCaption")}
      </figcaption>
    </figure>
  );
}
