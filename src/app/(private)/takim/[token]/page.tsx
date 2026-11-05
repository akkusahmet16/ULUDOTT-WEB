import { cookies } from "next/headers";
import { notFound } from "next/navigation";
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
  const { token } = await params;
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
          <p className={styles.eyebrow}>ULUDOTT · TAKIM ALANI</p>
          <h1>Takım erişimi</h1>
          <TeamLogin token={token} />
          </div>
        </main>
      );
    notFound();
  }
  return (
    <main className={styles.page}>
      <div className={styles.frame}>
      <p className={styles.eyebrow}>{view.eventTitle} · Takım alanı</p>
      <h1>{view.name}</h1>
      <div className={styles.stats}>
        <p><strong>{view.memberCount} / {view.expectedSize}</strong><span>Takım üyeleri</span></p>
        <p><strong>{view.status}</strong><span>Takım durumu</span></p>
      </div>
      <p>Katılım onayı ve kart uygunluğu ayrı değerlendirilir. Kişisel kartınıza başvuru makbuzunuzdan ulaşabilirsiniz.</p>
      <section className={styles.cards} aria-label="Takım kart özetleri">
        <h2>Katılım kartları</h2>
        <ul>
          {view.cards.map((c, i) => (
            <li key={i}><span>{c.name}</span><strong>{c.status}</strong></li>
          ))}
        </ul>
        <p>Bireysel kartınıza kendi makbuz bağlantınızdan ulaşın.</p>
      </section>
      <TeamLogout />
      </div>
    </main>
  );
}
