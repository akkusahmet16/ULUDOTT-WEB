import type { FanzinIssue } from "../domain/fanzin-types.ts";

interface FanzinHeroProps {
  readonly issue: FanzinIssue;
  readonly labels: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly readButton: string;
    readonly downloadButton: string;
    readonly archiveButton: string;
  };
}

export function FanzinHero({ issue, labels }: FanzinHeroProps) {
  return (
    <section className="section fanzin-hero-section">
      <div className="fanzin-hero-content">
        <p className="eyebrow">{labels.eyebrow}</p>
        <h1 className="fanzin-hero-heading">{labels.heading}</h1>
        <p className="lede">{issue.subtitle}</p>

        <div className="fanzin-hero-actions">
          <a href="#fanzin-oku" className="button">
            {labels.readButton}
          </a>
          <a
            href={issue.pdfUrl}
            download={`uludott-fanzin-sayi-${String(issue.issueNumber).padStart(2, "0")}.pdf`}
            className="button secondary"
          >
            {labels.downloadButton}
          </a>
          <a href="#arsiv" className="button secondary">
            {labels.archiveButton}
          </a>
        </div>
      </div>
    </section>
  );
}
