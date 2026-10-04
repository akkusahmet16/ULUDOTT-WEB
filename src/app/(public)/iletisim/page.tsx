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
      <section className="section" aria-label="İletişim kanalları">
        <h2>Bize ulaş</h2>
        <p>
          Topluluğun güncel kanallarını sayfanın altındaki sosyal medya
          simgelerinden açabilirsin.
        </p>
      </section>
    </PublicShell>
  );
}
