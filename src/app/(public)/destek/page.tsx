import { PublicShell } from "../../../components/layout/public-shell";
import { ButtonLink } from "../../../components/design-system/button";
export const metadata = { title: "İletişim — Uludott" };
export default function Page() {
  return (
    <PublicShell>
      <section className="hero">
        <p className="eyebrow">İletişim</p>
        <h1>İletişim</h1>
        <p className="lede">
          Bir fikrin, sorunun ya da birlikte yapmak istediğin bir şey varsa
          konuşalım.
        </p>
        <ButtonLink href="/hakkimizda">Topluluğu tanı</ButtonLink>
      </section>
      <section className="section">
        <h2>Birlikte neler yapabiliriz?</h2>
        <p className="empty">
          Doğrulanmış iletişim kanalları henüz yayımlanmadı. Hazır olduğunda
          burada paylaşılacak.
        </p>
      </section>
    </PublicShell>
  );
}
