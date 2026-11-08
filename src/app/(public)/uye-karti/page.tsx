import { PublicShell } from "../../../components/layout/public-shell";
import { getLocale } from "../../../i18n/server.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import { buildMetadata } from "../../../seo/build-metadata.ts";
import { CommunityCardFlow } from "../../../modules/community/ui/community-card-flow";

export const metadata = buildMetadata({ routeId: "memberCardVerification" });

export default async function Page() {
  const locale = await getLocale();
  const t = getTranslator(locale);

  return (
    <PublicShell>
      <section className="hero">
        <p className="eyebrow">{t("communityCard.heroEyebrow")}</p>
        <h1>{t("communityCard.heroTitle")}</h1>
        <p className="lede">{t("communityCard.heroLede")}</p>
      </section>

      <section className="section">
        <CommunityCardFlow />
      </section>
    </PublicShell>
  );
}
