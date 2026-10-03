import { headers } from "next/headers";
import { botConfiguration } from "../../../../lib/security/turnstile";
import { notFound } from "next/navigation";
import { getPublicForm } from "../../../../modules/forms/application/public-form-service";
import { UlujamForm } from "../../../../modules/applications/ui/ulujam-form";
import { getUlujamTeams } from "../../../../modules/applications/application/ulujam-teams";
import { PublicForm } from "../../../../modules/forms/ui/public-form";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function Page({
  params,
}: {
  params: Promise<{ formSlug: string }>;
}) {
  const { formSlug } = await params;
  const f = await getPublicForm(formSlug);
  const botConfig = {
    ...botConfiguration(),
    nonce: (await headers()).get("x-nonce") ?? undefined,
  };
  if (!f) notFound();
  return (
    <main>
      <h1>{f.title}</h1>
      {f.state === "open" && f.version ? (
        f.eventKind === "ulujam" && f.eventId ? (
          <UlujamForm
            botConfig={botConfig}
            eventId={f.eventId}
            definition={f.version.definition}
            publicForm={{ slug: formSlug, versionId: f.version.id }}
            teamOptions={await getUlujamTeams(formSlug)}
          />
        ) : (
          <PublicForm
            botConfig={botConfig}
            slug={formSlug}
            versionId={f.version.id}
            definition={f.version.definition}
          />
        )
      ) : (
        <p>{f.state}</p>
      )}
    </main>
  );
}
