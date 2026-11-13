"use client";

import { useTranslator } from "../../../i18n/client.tsx";
import { SozlukEntryCard, type SozlukEntryCardItem } from "./entry-card.tsx";

export function SozlukFeed({
  items,
  viewerAuthorId,
  viewerRank,
  isSubdomain,
  emptyKey,
  numberOffset,
}: {
  items: readonly SozlukEntryCardItem[];
  viewerAuthorId?: string;
  viewerRank?: string;
  isSubdomain: boolean;
  emptyKey: "sozluk.emptyFeed" | "sozluk.profileNoEntries";
  /** Başlık sayfasında Ekşi tarzı entry sıra numarası için; verilmezse numara gösterilmez. */
  numberOffset?: number;
}) {
  const t = useTranslator();

  if (items.length === 0) {
    return <p className="sozluk-empty">{t(emptyKey)}</p>;
  }

  return (
    <ol className="sozluk-entry-list">
      {items.map((item, index) => (
        <SozlukEntryCard
          key={item.id}
          item={item}
          index={numberOffset === undefined ? undefined : numberOffset + index + 1}
          viewerAuthorId={viewerAuthorId}
          viewerRank={viewerRank}
          isSubdomain={isSubdomain}
          onRequireAuth={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      ))}
    </ol>
  );
}
