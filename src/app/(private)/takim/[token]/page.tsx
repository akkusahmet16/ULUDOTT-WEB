import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getTeamView } from "../../../../modules/teams/application/team-access";
import { TeamLogin, TeamLogout } from "../../../../modules/teams/ui/team-page";
import { SubmissionError } from "../../../../modules/forms/domain/submission-error";
export const dynamic = "force-dynamic";
export const metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
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
        <main>
          <h1>Takım erişimi</h1>
          <TeamLogin token={token} />
        </main>
      );
    notFound();
  }
  return (
    <main>
      <h1>{view.name}</h1>
      <p>Takım durumu: {view.status}</p>
      <p>
        Üye sayısı: {view.memberCount} / {view.expectedSize}
      </p>
      <p>Katılım onayı ve kart uygunluğu ayrı değerlendirilir.</p>
      <TeamLogout />
    </main>
  );
}
