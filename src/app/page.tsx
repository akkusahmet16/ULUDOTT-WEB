import { PublicShell } from "../components/layout/public-shell";
import { ButtonLink } from "../components/design-system/button";
import { Card } from "../components/design-system/card";
export default function HomePage() {
  return (
    <PublicShell>
      <section className="hero">
        <p className="eyebrow">Dijital oyun tasarım topluluğu</p>
        <h1>Uludott</h1>
        <h2>
          Fikirden oyuna.
          <br />
          <span>Birlikte.</span>
        </h2>
        <p className="lede">
          Tasarımı, kodu, sanatı ve hikâyeyi aynı masada buluşturuyoruz.
          Öğrenmek, denemek ve oyun üretmek için bir aradayız.
        </p>
        <div className="actions">
          <ButtonLink href="/hakkimizda">Topluluğu tanı</ButtonLink>
          <ButtonLink href="/ulujam" secondary>
            UluJam’i keşfet
          </ButtonLink>
          <ButtonLink href="/destek" secondary>
            Destek ol
          </ButtonLink>
        </div>
      </section>
      <section className="section">
        <div className="grid">
          <Card>
            <span className="number">01 / TOPLULUK</span>
            <h3>
              Bir fikrin varsa,
              <br />
              bir yerin var.
            </h3>
            <p>Farklı disiplinler, ortak merak: oyun tasarımı.</p>
          </Card>
          <Card>
            <span className="number">02 / BULUŞMALAR</span>
            <h3>
              Sohbet et.
              <br />
              Yeni şeyler dene.
            </h3>
            <p className="empty">
              Henüz yayımlanmış etkinlik yok. Yeni buluşmalar burada
              duyurulacak.
            </p>
          </Card>
          <Card>
            <span className="number">03 / ULUJAM</span>
            <h3>
              Birlikte üretmenin
              <br />
              oyun hâli.
            </h3>
            <p>
              Başvurular henüz açılmadı. Duyurular yayımlandığında ayrıntılar
              paylaşılacak.
            </p>
          </Card>
        </div>
      </section>
    </PublicShell>
  );
}
