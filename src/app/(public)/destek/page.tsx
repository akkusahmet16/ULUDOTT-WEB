import { PublicShell } from "../../../components/layout/public-shell";
import { ButtonLink } from "../../../components/design-system/button";
export const metadata = { title: "Destek — Uludott" };
export default function Page() {
  return (
    <PublicShell>
      <section className="hero">
        <p className="eyebrow">Destek</p>
        <h1>
          Üretime
          <br />
          alan aç.
        </h1>
        <p className="lede">
          Bilgi, deneyim ve iş birlikleri topluluğun birlikte üretmesine katkı
          sağlar.
        </p>
        <ButtonLink href="/hakkimizda">Topluluğu tanı</ButtonLink>
      </section>
      <section className="section">
        <h2>Birlikte neler yapabiliriz?</h2>
        <p className="empty">
          Doğrulanmış iletişim ve destek kanalları henüz yayımlanmadı. Hazır
          olduğunda burada paylaşılacak.
        </p>
      </section>
    </PublicShell>
  );
}
