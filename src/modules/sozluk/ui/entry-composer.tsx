"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslator } from "../../../i18n/client.tsx";

export function SozlukEntryComposer({
  topicSlug,
  isLocked,
  hasViewer,
}: {
  topicSlug: string;
  isLocked: boolean;
  hasViewer: boolean;
}) {
  const t = useTranslator();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isLocked) {
    return (
      <div className="sozluk-composer">
        <p className="sozluk-count-badge">{t("sozluk.topicLockedNotice")}</p>
      </div>
    );
  }

  if (!hasViewer) {
    return (
      <div className="sozluk-composer">
        <p className="sozluk-count-badge">{t("sozluk.loginPromptToWrite")}</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/sozluk/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicSlug, content }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? t("errors.operationFailed"));
        return;
      }
      setContent("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="sozluk-composer" onSubmit={handleSubmit}>
      {error && <p className="sozluk-error">{error}</p>}
      <textarea
        className="sozluk-textarea"
        required
        minLength={3}
        maxLength={8000}
        placeholder={t("sozluk.entryPlaceholder")}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div>
        <button
          type="submit"
          disabled={submitting}
          className="sozluk-btn sozluk-btn-primary"
        >
          {t("sozluk.publishEntryButton")}
        </button>
      </div>
    </form>
  );
}
