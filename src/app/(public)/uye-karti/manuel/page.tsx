import { PublicShell } from "../../../../components/layout/public-shell";
import { getLocale } from "../../../../i18n/server.ts";
import { getTranslator } from "../../../../i18n/translate.ts";
import { buildMetadata } from "../../../../seo/build-metadata.ts";
import { CommunityManualVerifyForm } from "../../../../modules/community/ui/community-manual-verify-form";

export const metadata = buildMetadata({
  routeId: "memberCardManualVerification",
});

export default async function Page() {
  const locale = await getLocale();
  const t = getTranslator(locale);

  return (
    <PublicShell>
      <section className="hero">
        <p className="eyebrow">{t("communityCard.heroEyebrow")}</p>
        <h1>{t("communityCard.manualHeroTitle")}</h1>
        <p className="lede">{t("communityCard.manualHeroLede")}</p>
      </section>

      <section className="section">
        <CommunityManualVerifyForm />
      </section>
    </PublicShell>
  );
}
