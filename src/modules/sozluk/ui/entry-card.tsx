"use client";

import Link from "next/link";
import { useState } from "react";
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
  index,
  viewerAuthorId,
  viewerRank,
  isSubdomain,
  onRequireAuth,
}: {
  item: SozlukEntryCardItem;
  index?: number;
  viewerAuthorId?: string;
  viewerRank?: string;
  isSubdomain: boolean;
  onRequireAuth: () => void;
}) {
  const t = useTranslator();
  const locale = useLocale();
  const [upvotes, setUpvotes] = useState(item.upvotes);
  const [downvotes, setDownvotes] = useState(item.downvotes);
  const [vote, setVote] = useState<-1 | 0 | 1>(item.viewerVote);
  const [favorited, setFavorited] = useState(item.viewerFavorited);
  const [favCount, setFavCount] = useState(item.favoritesCount);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.content);
  const [content, setContent] = useState(item.content);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState(Boolean(item.editedAt));
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

  // Oy: anında (optimistic) güncelle, sunucu yanıtıyla eşitle, hata olursa geri al.
  async function handleVote(targetValue: 1 | -1) {
    if (!viewerAuthorId) {
      onRequireAuth();
      return;
    }
    const prev = { vote, upvotes, downvotes };
    const nextValue: -1 | 0 | 1 = vote === targetValue ? 0 : targetValue;
    let up = upvotes;
    let down = downvotes;
    if (vote === 1) up -= 1;
    if (vote === -1) down -= 1;
    if (nextValue === 1) up += 1;
    if (nextValue === -1) down += 1;
    setVote(nextValue);
    setUpvotes(Math.max(0, up));
    setDownvotes(Math.max(0, down));

    try {
      const res = await fetch(`/api/sozluk/entries/${item.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: nextValue }),
      });
      if (res.status === 404) {
        setDeleted(true);
        return;
      }
      if (!res.ok) throw new Error("vote-failed");
      const data = (await res.json()) as {
        upvotes: number;
        downvotes: number;
        userVote: -1 | 0 | 1;
      };
      setUpvotes(data.upvotes);
      setDownvotes(data.downvotes);
      setVote(data.userVote);
    } catch {
      setVote(prev.vote);
      setUpvotes(prev.upvotes);
      setDownvotes(prev.downvotes);
    }
  }

  async function handleFavorite() {
    if (!viewerAuthorId) {
      onRequireAuth();
      return;
    }
    const prev = { favorited, favCount };
    setFavorited(!favorited);
    setFavCount(Math.max(0, favCount + (favorited ? -1 : 1)));
    try {
      const res = await fetch(`/api/sozluk/entries/${item.id}/favorite`, {
        method: "POST",
      });
      if (res.status === 404) {
        setDeleted(true);
        return;
      }
      if (!res.ok) throw new Error("favorite-failed");
      const data = (await res.json()) as {
        favorited: boolean;
        favoritesCount: number;
      };
      setFavorited(data.favorited);
      setFavCount(data.favoritesCount);
    } catch {
      setFavorited(prev.favorited);
      setFavCount(prev.favCount);
    }
  }

  async function handleSaveEdit() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sozluk/entries/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      if (res.status === 404) {
        setDeleted(true);
        return;
      }
      if (res.ok) {
        setContent(draft);
        setEdited(true);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  // Silme: onaydan sonra entry anında kaybolur; sunucu reddederse geri gelir.
  async function handleDelete() {
    if (!window.confirm(t("sozluk.deleteConfirm"))) return;
    setDeleted(true);
    try {
      const res = await fetch(`/api/sozluk/entries/${item.id}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 404) return;
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setDeleted(false);
      window.alert(data.error ?? t("sozluk.deleteError"));
    } catch {
      setDeleted(false);
      window.alert(t("sozluk.deleteError"));
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

  const authorHref = sozlukHref(
    `/yazar/${encodeURIComponent(item.author.nick)}`,
    isSubdomain,
  );

  return (
    <li id={`entry-${item.id}`} className="sozluk-entry">
      {item.topic && (
        <h2 className="sozluk-entry-topic">
          <Link href={sozlukHref(`/${item.topic.slug}`, isSubdomain)}>
            {item.topic.title}
          </Link>
        </h2>
      )}

      <div className="sozluk-entry-row">
        {index !== undefined && (
          <span className="sozluk-entry-index" aria-hidden="true">
            {index}
          </span>
        )}
        <div className="sozluk-entry-content">
          {editing ? (
            <div className="sozluk-inline-form">
              <textarea
                className="sozluk-input sozluk-textarea"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className="sozluk-form-actions">
                <button
                  type="button"
                  className="sozluk-btn sozluk-btn-primary"
                  onClick={handleSaveEdit}
                  disabled={saving}
                >
                  {saving ? t("sozluk.loadingLabel") : t("sozluk.saveButton")}
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
        </div>
      </div>

      <footer className="sozluk-entry-footer">
        <div className="sozluk-entry-feedback">
          <button
            type="button"
            className="sozluk-vote sozluk-vote-up"
            data-active={vote === 1}
            onClick={() => handleVote(1)}
            aria-label={t("sozluk.sukelaButton")}
            title={t("sozluk.sukelaButton")}
          >
            <span aria-hidden="true">{"▲"}</span>
            <span>{upvotes}</span>
          </button>
          <button
            type="button"
            className="sozluk-vote sozluk-vote-down"
            data-active={vote === -1}
            onClick={() => handleVote(-1)}
            aria-label={t("sozluk.copButton")}
            title={t("sozluk.copButton")}
          >
            <span aria-hidden="true">{"▼"}</span>
            <span>{downvotes}</span>
          </button>
          <button
            type="button"
            className="sozluk-vote sozluk-vote-fav"
            data-active={favorited}
            onClick={handleFavorite}
            aria-label={t("sozluk.favoriteButton")}
            title={t("sozluk.favoriteButton")}
          >
            <span aria-hidden="true">{"✦"}</span>
            <span>{favCount}</span>
          </button>

          <span className="sozluk-entry-tools">
            <button
              type="button"
              className="sozluk-tool"
              onClick={() => setReporting((prev) => !prev)}
            >
              {t("sozluk.reportButton")}
            </button>
            {canModify && !editing && (
              <>
                <button type="button" className="sozluk-tool" onClick={() => setEditing(true)}>
                  {t("sozluk.editButton")}
                </button>
                <button
                  type="button"
                  className="sozluk-tool sozluk-tool-danger"
                  onClick={handleDelete}
                >
                  {t("sozluk.deleteButton")}
                </button>
              </>
            )}
          </span>
        </div>

        <div className="sozluk-entry-meta">
          <span className="sozluk-entry-date">
            {formatDate(item.createdAt, locale)}
            {edited && ` · ${t("sozluk.editedLabel")}`}
          </span>
          <Link href={authorHref} className="sozluk-entry-author">
            {item.author.nick}
          </Link>
          <Link href={authorHref} className="sozluk-entry-avatar" aria-hidden="true" tabIndex={-1}>
            {item.author.nick.slice(0, 1)}
          </Link>
        </div>
      </footer>

      {reporting && (
        <div className="sozluk-inline-form">
          <select
            className="sozluk-input"
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
          <div className="sozluk-form-actions">
            <button type="button" className="sozluk-btn sozluk-btn-primary" onClick={handleReport}>
              {t("sozluk.reportSubmit")}
            </button>
          </div>
        </div>
      )}

      {reportSent && <p className="sozluk-muted">{t("sozluk.reportSent")}</p>}
    </li>
  );
}
