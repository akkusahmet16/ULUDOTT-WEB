import { getWalletStatus } from "../../../../modules/wallet";
import { WalletActions } from "../../../../modules/wallet/ui/wallet-actions";
import { notFound } from "next/navigation";
import { getLocale } from "../../../../i18n/server.ts";
import { getOwnCard } from "../../../../modules/cards/application/card-service";
import { WebCard } from "../../../../modules/cards/ui/web-card";
import { buildMetadata } from "../../../../seo/build-metadata.ts";
export const dynamic = "force-dynamic";
export const metadata = buildMetadata({ routeId: "privateCard" });
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [{ token }, locale] = await Promise.all([params, getLocale()]);
  let card;
  try {
    card = await getOwnCard(token);
  } catch {
    notFound();
  }
  return (
    <main>
      <WebCard card={card} locale={locale} />
      <WalletActions
        status={await getWalletStatus(token)}
        cardToken={token}
        locale={locale}
      />
    </main>
  );
}
