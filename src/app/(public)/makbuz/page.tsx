import { ReceiptView } from "../../../modules/forms/ui/receipt-view";
export const metadata = { robots: { index: false, follow: false } };
export default function Page() {
  return (
    <main>
      <h1>Başvuru makbuzu</h1>
      <ReceiptView />
    </main>
  );
}
