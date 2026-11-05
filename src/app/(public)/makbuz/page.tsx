import { ReceiptView } from "../../../modules/forms/ui/receipt-view";
import { buildMetadata } from "../../../seo/build-metadata.ts";
export const metadata = buildMetadata({ routeId: "receipt" });
export default function Page() {
  return (
    <main>
      <h1>Başvuru makbuzu</h1>
      <ReceiptView />
    </main>
  );
}
