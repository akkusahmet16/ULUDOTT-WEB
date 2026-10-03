import { getWalletStatus } from "../../../../modules/wallet";
import { WalletActions } from "../../../../modules/wallet/ui/wallet-actions";
import { notFound } from "next/navigation";
import { getOwnCard } from "../../../../modules/cards/application/card-service";
import { WebCard } from "../../../../modules/cards/ui/web-card";
export const dynamic = "force-dynamic";
export const metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
  title: "Özel katılım kartı",
};
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let card;
  try {
    card = await getOwnCard(token);
  } catch {
    notFound();
  }
  return (
    <main>
      <WebCard card={card} />
      <WalletActions status={await getWalletStatus(token)} />
    </main>
  );
}
