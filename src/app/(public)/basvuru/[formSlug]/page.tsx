import { PublicShell } from "../../../../components/layout/public-shell";
import { getUlujamPresentation } from "../../../../modules/site-settings/application/ulujam-settings";
import { headers } from "next/headers";
import { botConfiguration } from "../../../../lib/security/turnstile";
import { notFound } from "next/navigation";
import { getPublicForm } from "../../../../modules/forms/application/public-form-service";
import { UlujamForm } from "../../../../modules/applications/ui/ulujam-form";
import { getUlujamTeams } from "../../../../modules/applications/application/ulujam-teams";
import { PublicForm } from "../../../../modules/forms/ui/public-form";
import { getLocale } from "../../../../i18n/server.ts";
import { getTranslator } from "../../../../i18n/translate.ts";
import { buildMetadata } from "../../../../seo/build-metadata.ts";
export const dynamic = "force-dynamic";
export const metadata = buildMetadata({ routeId: "application" });
export default async function Page({
  params,
}: {
  params: Promise<{ formSlug: string }>;
}) {
  const [{ formSlug }, locale] = await Promise.all([params, getLocale()]);
  const t = getTranslator(locale);
  const f = await getPublicForm(formSlug);
  const botConfig = {
    ...botConfiguration(),
    nonce: (await headers()).get("x-nonce") ?? undefined,
  };
  if (!f) notFound();
  const presentation = await getUlujamPresentation();
  const selected = presentation.formId === f.formId;
  return (
    <PublicShell>
      <section className="section application-page">
        <p className="eyebrow">
          {f.eventKind === "ulujam"
            ? t("forms.ulujamEyebrow")
            : t("forms.generalEyebrow")}
        </p>
        <h1>{selected ? presentation.application.title : f.title}</h1>
        {selected && (
          <p className="lede">{presentation.application.description}</p>
        )}
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
          <p role="status">
            {selected ? presentation.application.message : f.state}
          </p>
        )}
      </section>
    </PublicShell>
  );
}
