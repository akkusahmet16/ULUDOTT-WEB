import { PublicShell } from "../../../components/layout/public-shell.tsx";
import { getLocale } from "../../../i18n/server.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import { buildMetadata } from "../../../seo/build-metadata.ts";
import { FanzinHero } from "../../../modules/fanzin/ui/fanzin-hero.tsx";
import { FlipbookReader } from "../../../modules/fanzin/ui/flipbook-reader.tsx";
import { FanzinArchive } from "../../../modules/fanzin/ui/fanzin-archive.tsx";
import {
  FANZIN_ISSUE_01,
  ALL_FANZIN_ISSUES,
} from "../../../modules/fanzin/domain/mock-fanzin-data.ts";

export async function generateMetadata() {
  return buildMetadata({ routeId: "fanzin", locale: await getLocale() });
}

export default async function FanzinPage() {
  const locale = await getLocale();
  const t = getTranslator(locale);

  const activeIssue = FANZIN_ISSUE_01;
  const issues = ALL_FANZIN_ISSUES;

  return (
    <PublicShell>
      {/* GTA VI Neon Hero Section */}
      <FanzinHero
        issue={activeIssue}
        labels={{
          eyebrow: t("fanzin.eyebrow"),
          heading: t("fanzin.heading"),
          readButton: t("fanzin.readButton"),
          downloadButton: t("fanzin.downloadButton"),
          archiveButton: t("fanzin.archiveButton"),
          defaultSubtitle: t("fanzin.defaultSubtitle"),
        }}
      />

      {/* İnteraktif 3D Flipbook Okuyucu Bölümü */}
      <section
        id="fanzin-oku"
        className="section fanzin-reader-section"
        data-sky="#192437"
      >
        <div>
          <p className="eyebrow">{t("fanzin.readerEyebrow")}</p>
          <h2>{t("fanzin.readerHeading")}</h2>
        </div>
        <FlipbookReader
          issue={activeIssue}
          emptyTitle={t("fanzin.readerEmptyTitle")}
          emptyDesc={t("fanzin.readerEmptyDesc")}
        />
      </section>

      {/* Sayılar ve Yayınlar Arşivi */}
      <FanzinArchive
        issues={issues}
        labels={{
          archiveHeading: t("fanzin.archiveHeading"),
          archiveEyebrow: t("fanzin.archiveEyebrow"),
          archiveLede: t("fanzin.archiveLede"),
          readButton: t("fanzin.readButton"),
          downloadButton: t("fanzin.downloadButton"),
          archiveUpcomingBadge: t("fanzin.archiveUpcomingBadge"),
          archiveEmptyDesc: t("fanzin.archiveEmptyDesc"),
        }}
      />
    </PublicShell>
  );
}
