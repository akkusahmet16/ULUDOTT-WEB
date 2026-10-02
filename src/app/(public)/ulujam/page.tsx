import { PublicShell } from "../../../components/layout/public-shell";
import { Status } from "../../../components/design-system/status";
export const metadata = { title: "UluJam — Uludott" };
export default function Page() {
  return (
    <PublicShell>
      <section className="hero">
        <p className="eyebrow">UluJam</p>
        <h1>
          Bir fikir.
          <br />
          Bir takım.
          <br />
          Bir oyun.
        </h1>
        <p className="lede">
          Birlikte oyun üretme buluşmamızın duyuruları, arşivi ve oyunları bu
          alanda paylaşılacak.
        </p>
        <Status>Yakında</Status>
        <p>
          Başvurular henüz açılmadı. Kesin tarih ve katılım ayrıntıları
          duyurulacak.
        </p>
      </section>
      <section className="section">
        <h2>Üretimin izleri</h2>
        <p className="empty">
          Arşiv ve galeri henüz yayımlanmadı. Doğrulanmış oyunlar ve görseller
          hazır olduğunda burada yer alacak.
        </p>
      </section>
    </PublicShell>
  );
}
