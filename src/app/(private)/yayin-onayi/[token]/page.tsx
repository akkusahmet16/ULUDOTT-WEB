import { notFound } from "next/navigation";
import { getPublicationConsent } from "../../../../modules/games/application/credit-consent-service";
import { CreditConsent } from "../../../../modules/games/ui/credit-consent";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Özel yapımcı yayın onayı",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
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
