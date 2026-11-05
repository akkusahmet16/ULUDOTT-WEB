import { getLocale } from "../../../i18n/server.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import { ReceiptView } from "../../../modules/forms/ui/receipt-view";
import { buildMetadata } from "../../../seo/build-metadata.ts";
export const metadata = buildMetadata({ routeId: "receipt" });
export default async function Page() {
  const locale = await getLocale();
  const t = getTranslator(locale);
  return (
    <main>
      <h1>{t("receipt.pageHeading")}</h1>
      <ReceiptView />
    </main>
  );
}
