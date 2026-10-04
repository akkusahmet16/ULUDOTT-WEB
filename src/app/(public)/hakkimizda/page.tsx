import { PeopleStory } from "../../../modules/community/people-story";
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
      <PeopleStory />
      <section
        id="mekanlar"
        className="places-section section"
        data-sky="#293646"
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
