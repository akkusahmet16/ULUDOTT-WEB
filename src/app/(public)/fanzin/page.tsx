import { PublicShell } from "../../../components/layout/public-shell.tsx";
import { getLocale } from "../../../i18n/server.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import { buildMetadata } from "../../../seo/build-metadata.ts";
import { FanzinHero } from "../../../modules/fanzin/ui/fanzin-hero.tsx";
import { FlipbookReader } from "../../../modules/fanzin/ui/flipbook-reader.tsx";
import { FanzinArchive } from "../../../modules/fanzin/ui/fanzin-archive.tsx";
import { readPublicFanzin } from "../../../modules/publication/ui/public-queries.ts";

export async function generateMetadata() {
  return buildMetadata({ routeId: "fanzin", locale: await getLocale() });
}

export default async function FanzinPage() {
  const [locale, { activeIssue, issues }] = await Promise.all([
    getLocale(),
    readPublicFanzin(),
  ]);
  const t = getTranslator(locale);

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
          issueLabel={activeIssue ? t("fanzin.issueLabel", { number: String(activeIssue.issueNumber).padStart(2, "0") }) : undefined}
          digitalReadyText={t("fanzin.digitalReadyText")}
          interactiveSoonText={t("fanzin.interactiveSoonText")}
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
          publishedBadge: t("fanzin.publishedBadge"),
          issueLabel: (num) => t("fanzin.issueLabel", { number: String(num) }),
          pagesSuffix: (count) => t("fanzin.pagesSuffix", { count }),
        }}
      />
    </PublicShell>
  );
}
