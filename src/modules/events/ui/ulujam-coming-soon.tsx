import { Countdown } from "./countdown";
import { connection } from "next/server";
import Link from "next/link";
import { DEFAULT_LOCALE, type Locale } from "../../../i18n/config.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import type { UlujamPresentation } from "../../site-settings/domain/ulujam";
export async function UlujamComingSoon({
  year,
  startAt,
  presentation,
  locale = DEFAULT_LOCALE,
}: {
  year: number;
  startAt: Date | null;
  presentation?: UlujamPresentation;
  locale?: Locale;
}) {
  // Veri 30 sn önbellekli olabilir; initialNow her istekte taze olmalıdır.
  await connection();
  const t = getTranslator(locale);
  return (
    <section
      aria-label={t("ulujam.heading", { year })}
      className="section"
    >
      <p className="eyebrow">{t("ulujam.eyebrow")}</p>
      <h1>{t("ulujam.heading", { year })}</h1>
      <Countdown
        startAt={startAt?.toISOString() ?? null}
        initialNow={new Date().toISOString()}
      />
      <p className="lede">
        {presentation?.panelDescription ?? t("brand.motto")}
      </p>
      <p>
        {startAt
          ? t("ulujam.countdownPublishedCopy")
          : t("ulujam.countdownUnpublishedCopy")}{" "}
        {!presentation?.applicationPublished &&
          (presentation?.application.message ??
            t("ulujam.defaultUnpublishedMessage"))}
      </p>
      {presentation?.applicationPublished && (
        <section
          className="jam-application-callout"
          aria-label={t("home.ulujamApplicationsAria")}
        >
          <h2>{presentation.application.title}</h2>
          <p>{presentation.application.description}</p>
          {presentation.application.url ? (
            <Link className="button" href={presentation.application.url}>
              {presentation.application.buttonLabel}
            </Link>
          ) : (
            <p role="status">{presentation.application.message}</p>
          )}
        </section>
      )}
    </section>
  );
}
