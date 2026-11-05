"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslator } from "../../i18n/client.tsx";
import type { UlujamPresentation } from "../../modules/site-settings/domain/ulujam";
export function StoryPanels({ degreeContent, presentation }: { degreeContent: ReactNode; presentation: UlujamPresentation }) {
  const t = useTranslator();
  const [active, setActive] = useState<"ulujam" | "games" | null>(null);
  const [playing, setPlaying] = useState(false);
  const jam = useRef<HTMLDialogElement>(null),
    games = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement | null>(null);
  const close = () => {
    jam.current?.close();
    games.current?.close();
    setActive(null);
    setPlaying(false);
    trigger.current?.focus();
  };
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (active === "ulujam" ? jam : games).current?.showModal();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
  return (
    <>
      <section
        id="kesfet"
        className="story-panels"
        aria-label={t("home.storyPanelsAria")}
        data-sky="#192437"
      >
        {(
          [
            [
              "ulujam",
              presentation.panelTitle,
              presentation.panelDescription,
              "ulujam",
              t("home.openUlujamStoryAria"),
            ],
            [
              "games",
              t("home.degreeGamesTitle"),
              t("home.degreeGamesSubtitle"),
              "community",
              t("home.openDegreeGamesStoryAria"),
            ],
          ] as const
        ).map(([id, title, description, art, label]) => (
          <button
            key={id}
            className="story-panel-button"
            aria-label={label}
            aria-haspopup="dialog"
            aria-controls={`story-${id}`}
            onClick={(e) => {
              trigger.current = e.currentTarget;
              setActive(id);
            }}
            data-open-story={id}
          >
            <Image
              src={
                art === "ulujam"
                  ? "/community/01-anasayfa/anasayfa-ulujam-panel.webp"
                  : "/community/01-anasayfa/anasayfa-derece-panel.webp"
              }
              alt=""
              width={1080}
              height={1600}
              unoptimized
            />
            <span className="panel-caption">
              <span className="eyebrow">
                {id === "ulujam"
                  ? presentation.application.open
                    ? t("home.applicationsOpenEyebrow")
                    : t("home.createTogetherEyebrow")
                  : t("home.ulujam2026Eyebrow")}
              </span>
              <strong>{title}</strong>
              <span>{description}</span>
            </span>
          </button>
        ))}
      </section>
      <dialog
        ref={jam}
        id="story-ulujam"
        className="story-dialog"
        aria-label={t("nav.ulujam")}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="dialog-toolbar">
          <span>{t("nav.ulujam")}</span>
          <button onClick={close} data-close-story aria-label={t("common.close")}>
            ×
          </button>
        </div>
        {presentation.applicationPublished && (
          <section
            className="jam-application-callout"
            aria-label={t("home.ulujamApplicationsAria")}
          >
            <p className="eyebrow">
              {t("ulujam.heading", { year: presentation.year })}
            </p>
            <h2>{presentation.application.title}</h2>
            <p>{presentation.application.description}</p>
            {presentation.application.url ? (
              <Link
                className="button"
                href={presentation.application.url}
                onClick={close}
              >
                {presentation.application.buttonLabel}
              </Link>
            ) : (
              <p role="status">{presentation.application.message}</p>
            )}
          </section>
        )}
        {presentation.videoId && (
          <div className="vlog-player" data-video-id={presentation.videoId}>
            {playing ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${presentation.videoId}?autoplay=0&rel=0`}
                title={presentation.videoTitle}
                allow="encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <button
                className="vlog-play"
                aria-label={t("home.playVlogAria")}
                onClick={() => setPlaying(true)}
              >
                <Image
                  src={presentation.videoCover}
                  alt=""
                  width={2560}
                  height={1440}
                  unoptimized
                />
                <span aria-hidden="true">▶</span>
              </button>
            )}
          </div>
        )}
        <div className="dialog-description">
          <div>
            <p className="eyebrow">{t("home.createTogetherEyebrow")}</p>
            <h2>
              {presentation.videoId
                ? presentation.videoTitle
                : presentation.panelTitle}
            </h2>
          </div>
          <div>
            <p>{presentation.videoDescription}</p>
            {!presentation.applicationPublished && (
              <p>{presentation.application.message}</p>
            )}
            <Link className="button secondary" href="/ulujam" onClick={close}>
              {t("common.discoverUlujam")}
            </Link>
            {presentation.videoId && (
              <a
                href={`https://youtu.be/${presentation.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("home.watchOnYoutube")}
              </a>
            )}
          </div>
        </div>
      </dialog>
      <dialog
        ref={games}
        id="story-games"
        className="story-dialog"
        aria-label={t("home.degreeGamesTitle")}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
      >
        <div className="dialog-toolbar">
          <span>{t("home.ulujam2026Eyebrow")}</span>
          <button onClick={close} data-close-story aria-label={t("common.close")}>
            ×
          </button>
        </div>
        <div className="degree-dialog-cover">
          <Image
            src="/community/06-oyunlar/derece-oyunlari-kapak.webp"
            alt=""
            width={1920}
            height={1080}
            unoptimized
          />
          <h2>{t("home.degreeGamesTitle")}</h2>
        </div>
        <div className="dialog-games">
          <p>{t("home.degreeGamesDialogCopy")}</p>
          {degreeContent}
          <Link
            className="button secondary"
            href="/oyunlar#derece-oyunlari"
            onClick={close}
          >
            {t("home.allDegreeGamesCta")}
          </Link>
        </div>
      </dialog>
    </>
  );
}
