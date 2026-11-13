"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslator } from "../../../i18n/client.tsx";
import { sozlukHref } from "./sozluk-links.ts";

export interface SozlukSidebarTopic {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly entryCount: number;
}

export interface SozlukChannelItem {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
}

export interface SozlukViewerAuthor {
  readonly id: string;
  readonly nick: string;
  readonly rank: string;
}

type FrameTab = "gundem" | "bugun";

export function SozlukShell({
  isSubdomain,
  viewer,
  channels,
  gundemTopics,
  bugunTopics,
  children,
}: {
  isSubdomain: boolean;
  viewer: SozlukViewerAuthor | null;
  channels: readonly SozlukChannelItem[];
  gundemTopics: readonly SozlukSidebarTopic[];
  bugunTopics: readonly SozlukSidebarTopic[];
  children: ReactNode;
}) {
  const t = useTranslator();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const activeChannelSlug = searchParams?.get("kanal") ?? null;

  const [frameTab, setFrameTab] = useState<FrameTab>(
    searchParams?.get("mode") === "bugun" ? "bugun" : "gundem",
  );
  const [frameOpen, setFrameOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SozlukSidebarTopic[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchSeq = useRef(0);

  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [newTopicOpen, setNewTopicOpen] = useState(false);

  const [nick, setNick] = useState("");
  const [bio, setBio] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newChannel, setNewChannel] = useState("gundem");
  const [newContent, setNewContent] = useState("");
  const [topicError, setTopicError] = useState<string | null>(null);
  const [topicSubmitting, setTopicSubmitting] = useState(false);

  useEffect(() => {
    if (viewer) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("onboarding") === "1") {
      setOnboardingOpen(true);
    }
  }, [viewer]);

  // Arama: 200ms debounce + eski yanıtları yok say.
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    const seq = ++searchSeq.current;
    setSearchLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/sozluk/search?q=${encodeURIComponent(q)}`);
        if (!res.ok || seq !== searchSeq.current) return;
        const data = (await res.json()) as { topics: SozlukSidebarTopic[] };
        setSearchResults(data.topics);
      } finally {
        if (seq === searchSeq.current) setSearchLoading(false);
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const frameTopics = frameTab === "gundem" ? gundemTopics : bugunTopics;

  function isActiveTopic(slug: string) {
    let current = pathname;
    try {
      current = decodeURIComponent(pathname);
    } catch {
      /* geçersiz URI — olduğu gibi karşılaştır */
    }
    return current === sozlukHref(`/${slug}`, isSubdomain);
  }

  function openFrame(tab: FrameTab) {
    setFrameTab(tab);
    setFrameOpen((prev) => (frameTab === tab ? !prev : true));
  }

  function clearSearch() {
    setSearchQuery("");
    setSearchResults([]);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const first = searchResults[0];
    if (first) {
      clearSearch();
      router.push(sozlukHref(`/${first.slug}`, isSubdomain));
      return;
    }
    if (viewer && searchQuery.trim().length >= 2) {
      setNewTitle(searchQuery.trim());
      clearSearch();
      setNewTopicOpen(true);
    }
  }

  async function handleRandomTopic() {
    const res = await fetch("/api/sozluk/random");
    if (res.ok) {
      const data = (await res.json()) as { slug: string | null };
      if (data.slug) {
        router.push(sozlukHref(`/${data.slug}`, isSubdomain));
      }
    }
  }

  async function handleOnboardingSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    const res = await fetch("/api/sozluk/auth/google/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nick, bio }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setAuthError(data.error ?? t("errors.operationFailed"));
      return;
    }
    setOnboardingOpen(false);
    router.replace(sozlukHref("/", isSubdomain));
    router.refresh();
  }

  async function handleLogout() {
    await fetch("/api/sozluk/auth/logout", { method: "POST" });
    router.refresh();
  }

  async function handleCreateTopic(e: React.FormEvent) {
    e.preventDefault();
    if (topicSubmitting) return;
    setTopicError(null);
    setTopicSubmitting(true);
    try {
      const res = await fetch("/api/sozluk/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          channelSlug: newChannel,
          content: newContent,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        topic?: { slug: string };
      };
      if (!res.ok || !data.topic) {
        setTopicError(data.error ?? t("errors.operationFailed"));
        return;
      }
      setNewTopicOpen(false);
      setNewTitle("");
      setNewContent("");
      router.push(sozlukHref(`/${data.topic.slug}`, isSubdomain));
      router.refresh();
    } finally {
      setTopicSubmitting(false);
    }
  }

  return (
    <div className="sozluk-root">
      <header className="sozluk-topbar">
        <div className="sozluk-topbar-inner">
          <Link href={sozlukHref("/", isSubdomain)} className="sozluk-brand">
            <span className="sozluk-brand-mark" aria-hidden="true">
              ✦
            </span>
            <span className="sozluk-brand-text">{t("sozluk.brand")}</span>
          </Link>

          <form className="sozluk-search-wrap" onSubmit={handleSearchSubmit} role="search">
            <input
              type="search"
              className="sozluk-search-input"
              placeholder={t("sozluk.searchPlaceholder")}
              aria-label={t("sozluk.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") clearSearch();
              }}
            />
            {searchQuery.trim().length >= 2 && (
              <div className="sozluk-search-dropdown">
                {searchResults.length > 0 ? (
                  searchResults.map((topic) => (
                    <Link
                      key={topic.id}
                      href={sozlukHref(`/${topic.slug}`, isSubdomain)}
                      className="sozluk-search-item"
                      onClick={clearSearch}
                    >
                      <span>{topic.title}</span>
                      <span className="sozluk-count">{topic.entryCount}</span>
                    </Link>
                  ))
                ) : searchLoading ? (
                  <div className="sozluk-search-item sozluk-muted">
                    {t("sozluk.loadingLabel")}
                  </div>
                ) : (
                  <div className="sozluk-search-item">
                    <span className="sozluk-muted">{t("sozluk.searchNoResults")}</span>
                    {viewer && (
                      <button
                        type="button"
                        className="sozluk-link-btn"
                        onClick={() => {
                          setNewTitle(searchQuery.trim());
                          clearSearch();
                          setNewTopicOpen(true);
                        }}
                      >
                        {t("sozluk.createMissingTopic")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </form>

          <div className="sozluk-topbar-actions">
            {viewer ? (
              <>
                <button
                  type="button"
                  className="sozluk-btn sozluk-btn-primary"
                  onClick={() => setNewTopicOpen(true)}
                >
                  {t("sozluk.newTopicButton")}
                </button>
                <Link
                  href={sozlukHref(
                    `/yazar/${encodeURIComponent(viewer.nick)}`,
                    isSubdomain,
                  )}
                  className="sozluk-top-link"
                >
                  {viewer.nick}
                </Link>
                <button type="button" className="sozluk-top-link" onClick={handleLogout}>
                  {t("sozluk.logoutButton")}
                </button>
              </>
            ) : (
              <a href="/api/sozluk/auth/google" className="sozluk-btn sozluk-btn-primary">
                {t("sozluk.googleSignInButton")}
              </a>
            )}
            <a href="https://uludott.com.tr" className="sozluk-top-link sozluk-top-link-dim">
              {t("sozluk.backToMainSite")}
            </a>
          </div>
        </div>

        <nav className="sozluk-topicnav" aria-label={t("sozluk.channelsLabel")}>
          <div className="sozluk-topicnav-inner">
            <button
              type="button"
              className="sozluk-topicnav-link"
              data-active={frameTab === "gundem"}
              onClick={() => openFrame("gundem")}
            >
              {t("sozluk.tabGundem")}
            </button>
            <button
              type="button"
              className="sozluk-topicnav-link"
              data-active={frameTab === "bugun"}
              onClick={() => openFrame("bugun")}
            >
              {t("sozluk.tabToday")}
            </button>
            <button type="button" className="sozluk-topicnav-link" onClick={handleRandomTopic}>
              {t("sozluk.tabRandom")}
            </button>
            <span className="sozluk-topicnav-sep" aria-hidden="true" />
            {channels.map((ch) => (
              <Link
                key={ch.id}
                href={sozlukHref(`/?kanal=${ch.slug}`, isSubdomain)}
                className="sozluk-topicnav-link sozluk-topicnav-channel"
                data-active={activeChannelSlug === ch.slug}
              >
                {`#${ch.slug}`}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <div className="sozluk-layout">
        <aside
          className="sozluk-left-frame"
          data-open={frameOpen}
          aria-label={t("sozluk.leftFrameAria")}
        >
          <div className="sozluk-frame-head">
            <h2 className="sozluk-frame-title">
              {frameTab === "gundem" ? t("sozluk.tabGundem") : t("sozluk.tabToday")}
            </h2>
            <div className="sozluk-frame-tabs">
              <button
                type="button"
                className="sozluk-frame-tab"
                data-active={frameTab === "gundem"}
                onClick={() => setFrameTab("gundem")}
              >
                {t("sozluk.tabGundem")}
              </button>
              <button
                type="button"
                className="sozluk-frame-tab"
                data-active={frameTab === "bugun"}
                onClick={() => setFrameTab("bugun")}
              >
                {t("sozluk.tabToday")}
              </button>
            </div>
          </div>
          {frameTopics.length > 0 ? (
            <ul className="sozluk-frame-list">
              {frameTopics.map((topic) => (
                <li key={topic.id}>
                  <Link
                    href={sozlukHref(`/${topic.slug}`, isSubdomain)}
                    className="sozluk-frame-item"
                    data-active={isActiveTopic(topic.slug)}
                    onClick={() => setFrameOpen(false)}
                  >
                    <span className="sozluk-frame-item-title">{topic.title}</span>
                    <small className="sozluk-count">{topic.entryCount}</small>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="sozluk-frame-empty">{t("sozluk.emptyAgenda")}</p>
          )}
        </aside>

        <main id="main-content" className="sozluk-main">{children}</main>
      </div>

      {onboardingOpen && !viewer && (
        <div className="sozluk-modal-backdrop">
          <form className="sozluk-modal" onSubmit={handleOnboardingSubmit}>
            <h2 className="sozluk-modal-title">{t("sozluk.onboardingTitle")}</h2>
            {authError && <p className="sozluk-error">{authError}</p>}

            <label className="sozluk-field">
              <span>{t("sozluk.nickLabel")}</span>
              <input
                className="sozluk-input"
                required
                minLength={3}
                maxLength={24}
                value={nick}
                placeholder={t("sozluk.nickPlaceholder")}
                onChange={(e) => setNick(e.target.value)}
              />
            </label>

            <label className="sozluk-field">
              <span>{t("sozluk.bioLabel")}</span>
              <input
                className="sozluk-input"
                maxLength={300}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </label>

            <div className="sozluk-form-actions">
              <button type="submit" className="sozluk-btn sozluk-btn-primary">
                {t("sozluk.onboardingSubmit")}
              </button>
              <button
                type="button"
                className="sozluk-btn"
                onClick={() => setOnboardingOpen(false)}
              >
                {t("sozluk.cancelButton")}
              </button>
            </div>
          </form>
        </div>
      )}

      {newTopicOpen && (
        <div className="sozluk-modal-backdrop">
          <form className="sozluk-modal" onSubmit={handleCreateTopic}>
            <h2 className="sozluk-modal-title">{t("sozluk.newTopicButton")}</h2>
            {topicError && <p className="sozluk-error">{topicError}</p>}

            <label className="sozluk-field">
              <span>{t("sozluk.topicTitleLabel")}</span>
              <input
                className="sozluk-input"
                required
                minLength={2}
                maxLength={100}
                placeholder={t("sozluk.topicTitlePlaceholder")}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </label>

            <label className="sozluk-field">
              <span>{t("sozluk.channelLabel")}</span>
              <select
                className="sozluk-input"
                value={newChannel}
                onChange={(e) => setNewChannel(e.target.value)}
              >
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.slug}>
                    {ch.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="sozluk-field">
              <span>{t("sozluk.entryContentLabel")}</span>
              <textarea
                className="sozluk-input sozluk-textarea"
                required
                minLength={3}
                placeholder={t("sozluk.entryPlaceholder")}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
            </label>

            <div className="sozluk-form-actions">
              <button
                type="submit"
                className="sozluk-btn sozluk-btn-primary"
                disabled={topicSubmitting}
              >
                {topicSubmitting ? t("sozluk.loadingLabel") : t("sozluk.publishTopicButton")}
              </button>
              <button
                type="button"
                className="sozluk-btn"
                onClick={() => setNewTopicOpen(false)}
              >
                {t("sozluk.cancelButton")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
