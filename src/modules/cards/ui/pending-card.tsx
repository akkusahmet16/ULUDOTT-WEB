import type { CardStatus } from "../domain/card-eligibility";
export function PendingCard({ status }: { status: CardStatus }) {
  return (
    <section aria-label="Kart uygunluğu">
      <h2>
        {status === "pending" ? "Onay bekleniyor" : "Katılım hakkı kapalı"}
      </h2>
      <p>
        {status === "pending"
          ? "Başvurunuz alındı. Bireysel katılımınız veya takım kadronuz onaylandığında giriş QR’ınız burada açılır."
          : "Katılımınızın veya etkinliğin durumu nedeniyle bu kart kullanılamaz."}
      </p>
      <p>Bu durumda giriş QR’ı ve Wallet hakkı kullanılamaz.</p>
    </section>
  );
}
