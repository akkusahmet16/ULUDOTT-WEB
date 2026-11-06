import type { FanzinIssue } from "../domain/fanzin-types.ts";

interface FanzinArchiveProps {
  readonly issues: readonly FanzinIssue[];
  readonly labels: {
    readonly archiveHeading: string;
    readonly archiveEyebrow: string;
    readonly archiveLede: string;
    readonly readButton: string;
    readonly downloadButton: string;
    readonly archiveUpcomingBadge: string;
  };
}

export function FanzinArchive({ issues, labels }: FanzinArchiveProps) {
  return (
    <section id="arsiv" className="section fanzin-archive-section">
      <div>
        <p className="eyebrow">{labels.archiveEyebrow}</p>
        <h2>{labels.archiveHeading}</h2>
        <p className="lede">{labels.archiveLede}</p>
      </div>

      <div className="grid fanzin-archive-grid">
        {issues.map((issue) => {
          const isPublished = issue.status === "published";
          return (
            <article key={issue.id} className="card fanzin-archive-card">
              <div className="fanzin-archive-card-meta">
                <span className="eyebrow">
                  {issue.season} {issue.year} • {issue.pageCount} Sayfa • {issue.accessType}
                </span>
                <span className="fanzin-card-status-pill">
                  {isPublished ? "Yayında" : labels.archiveUpcomingBadge}
                </span>
              </div>

              <h3 className="fanzin-archive-card-title">
                Sayı #{String(issue.issueNumber).padStart(2, "0")}: {issue.title}
              </h3>
              <p className="fanzin-archive-card-desc">{issue.description}</p>

              <div className="fanzin-archive-actions">
                {isPublished ? (
                  <>
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
                  </>
                ) : (
                  <span
                    className="button secondary fanzin-disabled-button"
                    aria-disabled="true"
                  >
                    {labels.archiveUpcomingBadge}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
