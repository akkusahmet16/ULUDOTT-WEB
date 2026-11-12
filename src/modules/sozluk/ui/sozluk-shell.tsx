"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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

export function SozlukShell({
  isSubdomain,
  viewer,
  channels,
  topics,
  activeChannelSlug,
  activeMode,
  children,
}: {
  isSubdomain: boolean;
  viewer: SozlukViewerAuthor | null;
  channels: readonly SozlukChannelItem[];
  topics: readonly SozlukSidebarTopic[];
  activeChannelSlug?: string;
  activeMode: "gundem" | "bugun" | "kanal";
  children: ReactNode;
}) {
  const t = useTranslator();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SozlukSidebarTopic[]>([]);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [newTopicOpen, setNewTopicOpen] = useState(false);

  const [nick, setNick] = useState("");
  const [bio, setBio] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newChannel, setNewChannel] = useState("gundem");
  const [newContent, setNewContent] = useState("");
  const [topicError, setTopicError] = useState<string | null>(null);

  useEffect(() => {
    if (viewer) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("onboarding") === "1") {
      setOnboardingOpen(true);
    }
  }, [viewer]);

  async function handleSearchChange(value: string) {
    setSearchQuery(value);
    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const res = await fetch(
      `/api/sozluk/search?q=${encodeURIComponent(value.trim())}`,
    );
    if (res.ok) {
      const data = (await res.json()) as { topics: SozlukSidebarTopic[] };
      setSearchResults(data.topics);
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
    setTopicError(null);
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
  }

  return (
    <div className="sozluk-root">
      <header className="sozluk-topbar">
        <div className="sozluk-topbar-inner">
          <Link href={sozlukHref("/", isSubdomain)} className="sozluk-brand">
            {t("sozluk.brand")}
          </Link>

          <div className="sozluk-search-wrap">
            <input
              type="search"
              className="sozluk-search-input"
              placeholder={t("sozluk.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchQuery.trim().length >= 2 && (
              <div className="sozluk-search-dropdown">
                {searchResults.length > 0 ? (
                  searchResults.map((topic) => (
                    <Link
                      key={topic.id}
                      href={sozlukHref(`/${topic.slug}`, isSubdomain)}
                      className="sozluk-search-item"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                    >
                      <span>{topic.title}</span>
                      <span className="sozluk-count-badge">{topic.entryCount}</span>
                    </Link>
                  ))
                ) : (
                  <div className="sozluk-search-item">
                    <span>{t("sozluk.searchNoResults")}</span>
                    {viewer && (
                      <button
                        type="button"
                        className="sozluk-btn"
                        onClick={() => {
                          setNewTitle(searchQuery.trim());
                          setSearchQuery("");
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
          </div>

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
                  className="sozluk-btn"
                >
                  {`@${viewer.nick}`}
                </Link>
                <button
                  type="button"
                  className="sozluk-btn"
                  onClick={handleLogout}
                >
                  {t("sozluk.logoutButton")}
                </button>
              </>
            ) : (
              <a
                href="/api/sozluk/auth/google"
                className="sozluk-btn sozluk-btn-primary"
              >
                {t("sozluk.googleSignInButton")}
              </a>
            )}
            <a href="https://uludott.com.tr" className="sozluk-btn">
              {t("sozluk.backToMainSite")}
            </a>
          </div>
        </div>

        <nav className="sozluk-subnav">
          <Link
            href={sozlukHref("/", isSubdomain)}
            className="sozluk-subnav-link"
            data-active={activeMode === "gundem" && !activeChannelSlug}
          >
            {t("sozluk.tabGundem")}
          </Link>
          <Link
            href={sozlukHref("/?mode=bugun", isSubdomain)}
            className="sozluk-subnav-link"
            data-active={activeMode === "bugun"}
          >
            {t("sozluk.tabToday")}
          </Link>
          <button
            type="button"
            className="sozluk-subnav-link sozluk-subnav-btn"
            onClick={handleRandomTopic}
          >
            {t("sozluk.tabRandom")}
          </button>
          {channels.map((ch) => (
            <Link
              key={ch.id}
              href={sozlukHref(`/?kanal=${ch.slug}`, isSubdomain)}
              className="sozluk-subnav-link"
              data-active={activeChannelSlug === ch.slug}
            >
              {`#${ch.slug}`}
            </Link>
          ))}
        </nav>
      </header>

      <div className="sozluk-layout">
        <aside className="sozluk-left-frame">
          <div className="sozluk-frame-tabs">
            <Link
              href={sozlukHref("/", isSubdomain)}
              className="sozluk-subnav-link"
              data-active={activeMode === "gundem"}
            >
              {t("sozluk.tabGundem")}
            </Link>
            <Link
              href={sozlukHref("/?mode=bugun", isSubdomain)}
              className="sozluk-subnav-link"
              data-active={activeMode === "bugun"}
            >
              {t("sozluk.tabToday")}
            </Link>
          </div>
          {topics.length > 0 ? (
            <ul className="sozluk-frame-list">
              {topics.map((topic) => (
                <li key={topic.id} className="sozluk-frame-item">
                  <Link href={sozlukHref(`/${topic.slug}`, isSubdomain)}>
                    <span>{topic.title}</span>
                    <span className="sozluk-count-badge">{topic.entryCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="sozluk-count-badge">{t("sozluk.emptyAgenda")}</p>
          )}
        </aside>

        <main className="sozluk-main">{children}</main>
      </div>

      {onboardingOpen && !viewer && (
        <div className="sozluk-modal-backdrop">
          <form className="sozluk-modal" onSubmit={handleOnboardingSubmit}>
            <h2>{t("sozluk.onboardingTitle")}</h2>
            {authError && <p className="sozluk-error">{authError}</p>}

            <label>
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

            <label>
              <span>{t("sozluk.bioLabel")}</span>
              <input
                className="sozluk-input"
                maxLength={300}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </label>

            <div className="sozluk-entry-actions">
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
            <h2>{t("sozluk.newTopicButton")}</h2>
            {topicError && <p className="sozluk-error">{topicError}</p>}

            <label>
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

            <label>
              <span>{t("sozluk.channelLabel")}</span>
              <select
                className="sozluk-select"
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

            <label>
              <span>{t("sozluk.entryContentLabel")}</span>
              <textarea
                className="sozluk-textarea"
                required
                minLength={3}
                placeholder={t("sozluk.entryPlaceholder")}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
            </label>

            <div className="sozluk-entry-actions">
              <button type="submit" className="sozluk-btn sozluk-btn-primary">
                {t("sozluk.publishTopicButton")}
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
