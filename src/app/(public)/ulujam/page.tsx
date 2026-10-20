import { PublicShell } from "../../../components/layout/public-shell";
import {
  readPublishedYearStart,
  readGalleryImages,
  readUlujamPresentation,
  readPublishedArchives,
} from "../../../modules/publication/ui/public-queries";
import { UlujamComingSoon } from "../../../modules/events/ui/ulujam-coming-soon";
import { UlujamArchive } from "../../../modules/events/ui/ulujam-archive";
export const metadata = {
  title: "UluJam — Uludott",
  description: "UluJam arşivleri, oyun sonuçları ve yeni dönem duyuruları.",
  alternates: { canonical: "/ulujam" },
};
export default async function Page() {
  const [presentation, archives, legacyGallery] = await Promise.all([
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
      />
      {archives.map((archive) => (
        <UlujamArchive
          key={archive.year}
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
