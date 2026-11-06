import { PeopleStory } from "../../../modules/community/people-story";
import Image from "next/image";
import { PublicShell } from "../../../components/layout/public-shell";
import { ButtonLink } from "../../../components/design-system/button";
import { getLocale } from "../../../i18n/server.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import { readPeopleContent, readPlacesSettings } from "../../../modules/publication/ui/public-queries";
import { buildMetadata } from "../../../seo/build-metadata.ts";
export async function generateMetadata() {
  return buildMetadata({ routeId: "about", locale: await getLocale() });
}
// i18n fallback references: ["about.placesCafesTitle", "about.placesCafe1", "about.placesCafe2", "about.placesCafe3", "about.placesVenuesTitle", "about.placesVenue1", "about.placesVenue2"]
export default async function Page() {
  const [locale, chapters, placesData] = await Promise.all([
    getLocale(),
    readPeopleContent(),
    readPlacesSettings(),
  ]);
  const t = getTranslator(locale);
  const places = placesData.data.scenes;
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
        <p className="eyebrow">{placesData.data.eyebrow || t("about.placesEyebrow")}</p>
        <h2>{placesData.data.heading || t("about.placesHeading")}</h2>
        {places.map(({ id, title, image, names }, i) => (
          <article className={`place-scene place-${i}`} key={id || title}>
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
