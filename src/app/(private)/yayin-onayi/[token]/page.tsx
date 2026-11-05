import { notFound } from "next/navigation";
import { getPublicationConsent } from "../../../../modules/games/application/credit-consent-service";
import { CreditConsent } from "../../../../modules/games/ui/credit-consent";
import { buildMetadata } from "../../../../seo/build-metadata.ts";
export const dynamic = "force-dynamic";
export const metadata = buildMetadata({ routeId: "privateConsent" });
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let initial;
  try {
    initial = await getPublicationConsent(token);
  } catch {
    notFound();
  }
  return (
    <main>
      <CreditConsent token={token} initial={initial} />
    </main>
  );
}
