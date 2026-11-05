import { PublicShell } from "../../../components/layout/public-shell";
import {
  readPublishedYearStart,
  readGalleryImages,
  readUlujamPresentation,
  readPublishedArchives,
} from "../../../modules/publication/ui/public-queries";
import { UlujamComingSoon } from "../../../modules/events/ui/ulujam-coming-soon";
import { UlujamArchive } from "../../../modules/events/ui/ulujam-archive";
import { getLocale } from "../../../i18n/server.ts";
import { buildMetadata } from "../../../seo/build-metadata.ts";
export async function generateMetadata() {
  return buildMetadata({ routeId: "ulujam", locale: await getLocale() });
}
export default async function Page() {
  const [locale, presentation, archives, legacyGallery] = await Promise.all([
    getLocale(),
    readUlujamPresentation(),
    readPublishedArchives(),
    readGalleryImages(2026),
  ]);
  const startAt = await readPublishedYearStart(presentation.year);
  return (
    <PublicShell>
      <UlujamComingSoon
        year={presentation.year}
        startAt={startAt}
        presentation={presentation}
        locale={locale}
      />
      {archives.map((archive) => (
        <UlujamArchive
          key={archive.year}
          locale={locale}
          archive={
            archive.year === 2026 &&
            archive.revision === 0 &&
            legacyGallery.length
              ? {
                  ...archive,
                  gallery: legacyGallery.map(({ src, alt }) => ({ src, alt })),
                }
              : archive
          }
        />
      ))}
    </PublicShell>
  );
}
