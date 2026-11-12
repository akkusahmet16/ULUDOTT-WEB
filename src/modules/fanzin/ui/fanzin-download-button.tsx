"use client";

import type { ReactNode } from "react";
import { trackSiteEvent } from "../../../lib/analytics/tracker.ts";

interface FanzinDownloadButtonProps {
  readonly href: string;
  readonly download?: string;
  readonly className?: string;
  readonly issueId?: string;
  readonly issueNumber?: number;
  readonly title?: string;
  readonly children: ReactNode;
}

export function FanzinDownloadButton({
  href,
  download,
  className,
  issueId,
  issueNumber,
  title,
  children,
}: FanzinDownloadButtonProps) {
  const downloadUrl = href.includes("?")
    ? `${href}&download=1&tracked=1`
    : `${href}?download=1&tracked=1`;

  const handleClick = () => {
    trackSiteEvent(
      "download",
      `Fanzin İndir: #${issueNumber ?? 1} - ${title || "Fanzin Sayısı"}`,
      {
        issueId,
        issueNumber,
        title,
        downloadUrl,
      },
    );
  };

  return (
    <a
      href={downloadUrl}
      download={download}
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
