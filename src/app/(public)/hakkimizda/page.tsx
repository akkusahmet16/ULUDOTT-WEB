import { PublicShell } from "../../../components/layout/public-shell";
import { ButtonLink } from "../../../components/design-system/button";
export const metadata = { title: "Hakkımızda — Uludott" };
export default function Page() {
  return (
    <PublicShell>
      <section className="hero">
        <p className="eyebrow">Hakkımızda</p>
        <h1>Birlikte öğren. Birlikte üret.</h1>
        <p className="lede">
          Uludott, Dijital Oyun Tasarım Topluluğu. Oyun tasarımına ilgi
          duyanları fikir, deneyim ve üretim etrafında buluşturur.
        </p>
        <ButtonLink href="/ulujam">UluJam’i keşfet</ButtonLink>
      </section>
      <section className="section">
        <h2>Her disipline yer var.</h2>
        <p>
          Kod, görsel sanat, ses, anlatı ve tasarım aynı oyunun parçaları. Merak
          ederek, paylaşarak ve deneyerek ilerliyoruz.
        </p>
      </section>
    </PublicShell>
  );
}
