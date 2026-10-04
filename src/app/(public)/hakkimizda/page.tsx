import Image from "next/image";
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
      <section
        id="yonetim-kurulu"
        className="people-section section"
        aria-label="Yönetim kurulu"
      >
        <p className="eyebrow">People / Topluluğun insanları</p>
        <h2>Yönetim kurulu.</h2>
        <p className="lede">Birlikte üreten topluluğun arkasındaki ekip.</p>
        <p className="placeholder-note">
          Görsel yer tutucu · İsimler, görevler ve topluluk portreleri daha
          sonra eklenecek.
        </p>
        <div className="people-grid">
          {["board-1", "board-2", "board-3"].map((asset, i) => (
            <article className="person-scene" key={asset}>
              <span className="scene-number" aria-hidden="true">
                0{i + 1}
              </span>
              <Image
                src={`/theme/reference/${asset}.avif`}
                alt="GTA VI referans portresi; topluluk üyesi değildir"
                width={1600}
                height={1600}
                sizes="(max-width: 699px) 100vw, 33vw"
                unoptimized
              />
              <div>
                <p className="eyebrow">Yönetim kurulu / Görsel yer tutucu</p>
                <h3>İsim eklenecek</h3>
                <p>Görev eklenecek</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section
        id="mekanlar"
        className="places-section section"
        aria-label="Sponsorlar ve mekânlar"
      >
        <p className="eyebrow">Places / Bir araya geldiğimiz yerler</p>
        <h2>Birlikte. Aynı yerde.</h2>
        <p className="placeholder-note">
          Görsel yer tutucu · Gerçek sponsor ve mekân bilgileri henüz eklenmedi.
        </p>
        {[
          ["Etkinlik kafeleri", "venue-1"],
          ["Salonlar & buluşma alanları", "venue-2"],
          ["Sponsorlar", "venue-1"],
        ].map(([title, asset], i) => (
          <article className={`place-scene place-${i}`} key={title}>
            <Image
              src={`/theme/reference/${asset}.avif`}
              alt="GTA VI mekân referansı; gerçek etkinlik mekânı değildir"
              width={2560}
              height={1440}
              sizes="100vw"
              unoptimized
            />
            <div>
              <p className="eyebrow">Görsel yer tutucu / 0{i + 1}</p>
              <h3>{title}</h3>
              <p>İsim, konum ve ayrıntılar daha sonra eklenecek.</p>
            </div>
          </article>
        ))}
      </section>
    </PublicShell>
  );
}
