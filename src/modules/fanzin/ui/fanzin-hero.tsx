import type { FanzinIssue } from "../domain/fanzin-types.ts";
import { FanzinDownloadButton } from "./fanzin-download-button.tsx";

interface FanzinHeroProps {
  readonly issue?: FanzinIssue | null;
  readonly labels: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly readButton: string;
    readonly downloadButton: string;
    readonly archiveButton: string;
    readonly defaultSubtitle: string;
  };
}

export function FanzinHero({ issue, labels }: FanzinHeroProps) {
  const hasPdf = Boolean(issue?.pdfUrl && issue.pdfUrl !== "#");

  return (
    <section className="section fanzin-hero-section">
      <div className="fanzin-hero-content">
        <p className="eyebrow">{labels.eyebrow}</p>
        <h1 className="fanzin-hero-heading">{labels.heading}</h1>
        <p className="lede">{issue?.subtitle || labels.defaultSubtitle}</p>

        <div className="fanzin-hero-actions">
          <a href="#fanzin-oku" className="button">
            {labels.readButton}
          </a>
          {hasPdf && issue && (
            <FanzinDownloadButton
              href={issue.pdfUrl}
              download={`uludott-fanzin-sayi-${String(issue.issueNumber).padStart(2, "0")}.pdf`}
              className="button secondary"
              issueId={issue.id}
              issueNumber={issue.issueNumber}
              title={issue.title}
            >
              {labels.downloadButton}
            </FanzinDownloadButton>
          )}
          <a href="#arsiv" className="button secondary">
            {labels.archiveButton}
          </a>
        </div>
      </div>
    </section>
  );
}
