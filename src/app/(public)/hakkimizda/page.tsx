import { PeopleStory } from "../../../modules/community/people-story";
import Image from "next/image";
import { PublicShell } from "../../../components/layout/public-shell";
import { ButtonLink } from "../../../components/design-system/button";
import { getLocale } from "../../../i18n/server.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import { readPeopleContent } from "../../../modules/publication/ui/public-queries";
import { buildMetadata } from "../../../seo/build-metadata.ts";
export async function generateMetadata() {
  return buildMetadata({ routeId: "about", locale: await getLocale() });
}
export default async function Page() {
  const [locale, chapters] = await Promise.all([
    getLocale(),
    readPeopleContent(),
  ]);
  const t = getTranslator(locale);
  const places = [
    {
      title: t("about.placesCafesTitle"),
      image: "/community/03-hakkimizda/places/places-kafeler.webp",
      names: [
        t("about.placesCafe1"),
        t("about.placesCafe2"),
        t("about.placesCafe3"),
      ],
    },
    {
      title: t("about.placesVenuesTitle"),
      image: "/community/03-hakkimizda/places/places-salonlar.webp",
      names: [t("about.placesVenue1"), t("about.placesVenue2")],
    },
  ] as const;
  return (
    <PublicShell>
      <section className="hero">
        <p className="eyebrow">{t("about.eyebrow")}</p>
        <h1>{t("about.heading")}</h1>
        <p className="lede">{t("about.lede")}</p>
        <ButtonLink href="/ulujam">{t("common.discoverUlujam")}</ButtonLink>
      </section>
      <PeopleStory chapters={chapters} locale={locale} />
      <section
        id="mekanlar"
        className="places-section section"
        data-sky="#293646"
        aria-label={t("about.placesAria")}
      >
        <p className="eyebrow">{t("about.placesEyebrow")}</p>
        <h2>{t("about.placesHeading")}</h2>
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
