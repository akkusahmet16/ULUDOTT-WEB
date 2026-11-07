import type { FanzinIssue } from "../domain/fanzin-types.ts";

interface FanzinArchiveProps {
  readonly issues: readonly FanzinIssue[];
  readonly activeIssueId?: string | null;
  readonly labels: {
    readonly archiveHeading: string;
    readonly archiveEyebrow: string;
    readonly archiveLede: string;
    readonly readButton: string;
    readonly downloadButton: string;
    readonly archiveUpcomingBadge: string;
    readonly archiveEmptyDesc: string;
    readonly publishedBadge: string;
    readonly issueLabel: (num: string | number) => string;
    readonly pagesSuffix: (count: number) => string;
  };
}

export function FanzinArchive({ issues, activeIssueId, labels }: FanzinArchiveProps) {
  return (
    <section id="arsiv" className="section fanzin-archive-section">
      <div>
        <p className="eyebrow">{labels.archiveEyebrow}</p>
        <h2>{labels.archiveHeading}</h2>
        <p className="lede">{labels.archiveLede}</p>
      </div>

      {issues.length > 0 ? (
        <div className="grid fanzin-archive-grid">
          {issues.map((issue) => {
            const isPublished = issue.status === "published";
            const isCurrent = activeIssueId
              ? issue.id === activeIssueId
              : isPublished && issue.id === issues.find((i) => i.status === "published")?.id;
            const hasPdf = Boolean(issue.pdfUrl && issue.pdfUrl !== "#" && issue.pdfUrl.trim() !== "");

            return (
              <article key={issue.id} className="card fanzin-archive-card">
                <div className="fanzin-archive-card-meta">
                  <span className="eyebrow">
                    {issue.season} {issue.year} • {labels.pagesSuffix(issue.pageCount)} • {issue.accessType}
                  </span>
                  <span className="fanzin-card-status-pill">
                    {isPublished ? labels.publishedBadge : labels.archiveUpcomingBadge}
                  </span>
                </div>

                <h3 className="fanzin-archive-card-title">
                  {labels.issueLabel(String(issue.issueNumber).padStart(2, "0"))}: {issue.title}
                </h3>
                <p className="fanzin-archive-card-desc">{issue.description}</p>

                <div className="fanzin-archive-actions">
                  {isPublished ? (
                    <>
                      {/* Güncel fanzin için hem okuyucu hem indirme butonu, arşivdeki diğer sayılar için yalnızca indirme butonu */}
                      {isCurrent && (
                        <a href="#fanzin-oku" className="button">
                          {labels.readButton}
                        </a>
                      )}
                      {hasPdf ? (
                        <a
                          href={issue.pdfUrl.includes("?") ? `${issue.pdfUrl}&download=1` : `${issue.pdfUrl}?download=1`}
                          download={`uludott-fanzin-sayi-${String(issue.issueNumber).padStart(2, "0")}.pdf`}
                          className={isCurrent ? "button secondary" : "button"}
                        >
                          {labels.downloadButton}
                        </a>
                      ) : null}
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
      ) : (
        <div className="fanzin-empty-archive">
          <div className="fanzin-empty-card">
            <p className="fanzin-empty-desc">{labels.archiveEmptyDesc}</p>
          </div>
        </div>
      )}
    </section>
  );
}
