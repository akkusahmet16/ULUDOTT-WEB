import { PeopleStory } from "../../../modules/community/people-story";
import Image from "next/image";
import { PublicShell } from "../../../components/layout/public-shell";
import { ButtonLink } from "../../../components/design-system/button";
import { getPeopleContent } from "../../../modules/community/people-content";
export const metadata = { title: "Hakkımızda — Uludott" };
export const dynamic = "force-dynamic";
const places = [
  {
    title: "Etkinlik kafeleri",
    image: "/community/03-hakkimizda/places/places-kafeler.webp",
    names: ["Ecem Kafe & Oyun", "Nest'o Coffe Roastery", "Müptela Kahve"],
  },
  {
    title: "Salonlar & Buluşma Alanları",
    image: "/community/03-hakkimizda/places/places-salonlar.webp",
    names: ["Çamlık Personel Yemekhanesi", "Mete Cengiz Kültür Merkezi"],
  },
] as const;
export default async function Page() {
  const chapters = await getPeopleContent();
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
      <PeopleStory chapters={chapters} />
      <section
        id="mekanlar"
        className="places-section section"
        data-sky="#293646"
        aria-label="Mekânlar"
      >
        <p className="eyebrow">Bir araya geldiğimiz yerler</p>
        <h2>Birlikte. Aynı yerde.</h2>
        {places.map(({ title, image, names }, i) => (
          <article className={`place-scene place-${i}`} key={title}>
            <Image
              src={image}
              alt=""
              width={2560}
              height={1440}
              sizes="100vw"
            />
            <div>
              <p className="eyebrow">0{i + 1}</p>
              <h3>{title}</h3>
              <ul className="place-list">
                {names.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>
    </PublicShell>
  );
}
