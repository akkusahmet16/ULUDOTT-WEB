import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getLocale } from "../../../../i18n/server.ts";
import { getTranslator } from "../../../../i18n/translate.ts";
import { getTeamView } from "../../../../modules/teams/application/team-access";
import { TeamLogin, TeamLogout } from "../../../../modules/teams/ui/team-page";
import { SubmissionError } from "../../../../modules/forms/domain/submission-error";
import { buildMetadata } from "../../../../seo/build-metadata.ts";
import styles from "../../../../modules/teams/ui/team-page.module.css";
export const dynamic = "force-dynamic";
export const metadata = buildMetadata({ routeId: "privateTeam" });
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [{ token }, locale] = await Promise.all([params, getLocale()]);
  const t = getTranslator(locale);
  let view;
  try {
    view = await getTeamView(
      token,
      new Request("https://private.invalid", {
        headers: { cookie: (await cookies()).toString() },
      }),
    );
  } catch (e) {
    if (e instanceof SubmissionError && e.status === 403)
      return (
        <main className={styles.page}>
          <div className={styles.frame}>
            <p className={styles.eyebrow}>{t("teams.loginEyebrow")}</p>
            <h1>{t("teams.loginHeading")}</h1>
            <TeamLogin token={token} />
          </div>
        </main>
      );
    notFound();
  }
  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <p className={styles.eyebrow}>
          {t("teams.areaEyebrow", { eventTitle: view.eventTitle })}
        </p>
        <h1>{view.name}</h1>
        <div className={styles.stats}>
          <p>
            <strong>
              {view.memberCount} / {view.expectedSize}
            </strong>
            <span>{t("teams.membersLabel")}</span>
          </p>
          <p>
            <strong>{view.status}</strong>
            <span>{t("teams.statusLabel")}</span>
          </p>
        </div>
        <p>{t("teams.evaluationNotice")}</p>
        <section
          className={styles.cards}
          aria-label={t("teams.cardsSectionAria")}
        >
          <h2>{t("teams.cardsHeading")}</h2>
          <ul>
            {view.cards.map((c, i) => (
              <li key={i}>
                <span>{c.name}</span>
                <strong>{c.status}</strong>
              </li>
            ))}
          </ul>
          <p>{t("teams.personalCardHint")}</p>
        </section>
        <TeamLogout />
      </div>
    </main>
  );
}
