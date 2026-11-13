"use client";

import { useTranslator } from "../../i18n/client.tsx";

export default function SozlukLoading() {
  const t = useTranslator();
  return (
    <div className="sozluk-loading" role="status" aria-label={t("sozluk.loadingLabel")}>
      <div className="sozluk-loading-bar" />
      <div className="sozluk-skeleton sozluk-skeleton-title" />
      <div className="sozluk-skeleton" />
      <div className="sozluk-skeleton" />
      <div className="sozluk-skeleton sozluk-skeleton-short" />
    </div>
  );
}
