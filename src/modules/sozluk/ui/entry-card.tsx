"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslator } from "../../../i18n/client.tsx";
import { formatDate } from "../../../i18n/format.ts";
import { SozlukMarkupRenderer } from "./markup-renderer.tsx";
import { sozlukHref } from "./sozluk-links.ts";

export interface SozlukEntryCardItem {
  readonly id: string;
  readonly content: string;
  readonly upvotes: number;
  readonly downvotes: number;
  readonly favoritesCount: number;
  readonly createdAt: string;
  readonly editedAt: string | null;
  readonly author: {
    readonly id: string;
    readonly nick: string;
    readonly rank: string;
  };
  readonly topic?: {
    readonly slug: string;
    readonly title: string;
  };
  readonly viewerVote: -1 | 0 | 1;
  readonly viewerFavorited: boolean;
}

export function SozlukEntryCard({
  item,
  viewerAuthorId,
  viewerRank,
  isSubdomain,
  onRequireAuth,
}: {
  item: SozlukEntryCardItem;
  viewerAuthorId?: string;
  viewerRank?: string;
  isSubdomain: boolean;
  onRequireAuth: () => void;
}) {
  const t = useTranslator();
  const locale = useLocale();
  const router = useRouter();
  const [upvotes, setUpvotes] = useState(item.upvotes);
  const [downvotes, setDownvotes] = useState(item.downvotes);
  const [vote, setVote] = useState<-1 | 0 | 1>(item.viewerVote);
  const [favorited, setFavorited] = useState(item.viewerFavorited);
  const [favCount, setFavCount] = useState(item.favoritesCount);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.content);
  const [content, setContent] = useState(item.content);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportNote, setReportNote] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [deleted, setDeleted] = useState(false);

  if (deleted) return null;

  const canModify =
    viewerAuthorId === item.author.id ||
    viewerRank === "moderator" ||
    viewerRank === "admin";

  async function handleVote(targetValue: 1 | -1) {
    if (!viewerAuthorId) {
      onRequireAuth();
      return;
    }
    const nextValue = vote === targetValue ? 0 : targetValue;
    const res = await fetch(`/api/sozluk/entries/${item.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: nextValue }),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        upvotes: number;
        downvotes: number;
        userVote: -1 | 0 | 1;
      };
      setUpvotes(data.upvotes);
      setDownvotes(data.downvotes);
      setVote(data.userVote);
    }
  }

  async function handleFavorite() {
    if (!viewerAuthorId) {
      onRequireAuth();
      return;
    }
    const res = await fetch(`/api/sozluk/entries/${item.id}/favorite`, {
      method: "POST",
    });
    if (res.ok) {
      const data = (await res.json()) as {
        favorited: boolean;
        favoritesCount: number;
      };
      setFavorited(data.favorited);
      setFavCount(data.favoritesCount);
    }
  }

  async function handleSaveEdit() {
    const res = await fetch(`/api/sozluk/entries/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });
    if (res.ok) {
      setContent(draft);
      setEditing(false);
      router.refresh();
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/sozluk/entries/${item.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDeleted(true);
      router.refresh();
    }
  }

  async function handleReport() {
    if (!viewerAuthorId) {
      onRequireAuth();
      return;
    }
    const res = await fetch(`/api/sozluk/entries/${item.id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reportReason, note: reportNote }),
    });
    if (res.ok) {
      setReporting(false);
      setReportSent(true);
    }
  }

  return (
    <article id={`entry-${item.id}`} className="sozluk-entry-card">
      {item.topic && (
        <Link
          href={sozlukHref(`/${item.topic.slug}`, isSubdomain)}
          className="sozluk-entry-topic-link"
        >
          {item.topic.title}
        </Link>
      )}

      {editing ? (
        <div className="sozluk-composer">
          <textarea
            className="sozluk-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="sozluk-entry-actions">
            <button
              type="button"
              className="sozluk-btn sozluk-btn-primary"
              onClick={handleSaveEdit}
            >
              {t("sozluk.saveButton")}
            </button>
            <button
              type="button"
              className="sozluk-btn"
              onClick={() => {
                setEditing(false);
                setDraft(content);
              }}
            >
              {t("sozluk.cancelButton")}
            </button>
          </div>
        </div>
      ) : (
        <SozlukMarkupRenderer content={content} isSubdomain={isSubdomain} />
      )}

      <footer className="sozluk-entry-footer">
        <div className="sozluk-entry-actions">
          <button
            type="button"
            className="sozluk-action-btn"
            data-active={vote === 1}
            onClick={() => handleVote(1)}
          >
            {`${t("sozluk.sukelaButton")} (${upvotes})`}
          </button>
          <button
            type="button"
            className="sozluk-action-btn"
            data-active={vote === -1}
            onClick={() => handleVote(-1)}
          >
            {`${t("sozluk.copButton")} (${downvotes})`}
          </button>
          <button
            type="button"
            className="sozluk-action-btn"
            data-active={favorited}
            onClick={handleFavorite}
          >
            {`${t("sozluk.favoriteButton")} (${favCount})`}
          </button>
          <button
            type="button"
            className="sozluk-action-btn"
            onClick={() => setReporting((prev) => !prev)}
          >
            {t("sozluk.reportButton")}
          </button>
          {canModify && !editing && (
            <>
              <button
                type="button"
                className="sozluk-action-btn"
                onClick={() => setEditing(true)}
              >
                {t("sozluk.editButton")}
              </button>
              <button
                type="button"
                className="sozluk-action-btn"
                onClick={handleDelete}
              >
                {t("sozluk.deleteButton")}
              </button>
            </>
          )}
        </div>

        <div>
          <Link
            href={sozlukHref(
              `/yazar/${encodeURIComponent(item.author.nick)}`,
              isSubdomain,
            )}
            className="sozluk-bkz"
          >
            {`@${item.author.nick}`}
          </Link>
          <span> · {formatDate(item.createdAt, locale)}</span>
          {item.editedAt && <span> · {t("sozluk.editedLabel")}</span>}
        </div>
      </footer>

      {reporting && (
        <div className="sozluk-composer">
          <select
            className="sozluk-select"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          >
            <option value="spam">{t("sozluk.reportReasonSpam")}</option>
            <option value="harassment">{t("sozluk.reportReasonHarassment")}</option>
            <option value="rule_violation">{t("sozluk.reportReasonRule")}</option>
            <option value="spoiler">{t("sozluk.reportReasonSpoiler")}</option>
            <option value="other">{t("sozluk.reportReasonOther")}</option>
          </select>
          <input
            className="sozluk-input"
            value={reportNote}
            onChange={(e) => setReportNote(e.target.value)}
          />
          <button
            type="button"
            className="sozluk-btn sozluk-btn-primary"
            onClick={handleReport}
          >
            {t("sozluk.reportSubmit")}
          </button>
        </div>
      )}

      {reportSent && <p className="sozluk-count-badge">{t("sozluk.reportSent")}</p>}
    </article>
  );
}
