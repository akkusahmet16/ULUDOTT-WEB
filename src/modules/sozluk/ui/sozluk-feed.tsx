"use client";

import { useTranslator } from "../../../i18n/client.tsx";
import { SozlukEntryCard, type SozlukEntryCardItem } from "./entry-card.tsx";

export function SozlukFeed({
  items,
  viewerAuthorId,
  viewerRank,
  isSubdomain,
  emptyKey,
}: {
  items: readonly SozlukEntryCardItem[];
  viewerAuthorId?: string;
  viewerRank?: string;
  isSubdomain: boolean;
  emptyKey: "sozluk.emptyFeed" | "sozluk.profileNoEntries";
}) {
  const t = useTranslator();

  if (items.length === 0) {
    return <p className="sozluk-count-badge">{t(emptyKey)}</p>;
  }

  return (
    <div className="sozluk-entry-list">
      {items.map((item) => (
        <SozlukEntryCard
          key={item.id}
          item={item}
          viewerAuthorId={viewerAuthorId}
          viewerRank={viewerRank}
          isSubdomain={isSubdomain}
          onRequireAuth={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      ))}
    </div>
  );
}
