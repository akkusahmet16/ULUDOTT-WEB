"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
export function StoryPanels({ degreeContent }: { degreeContent: ReactNode }) {
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
        aria-label="Uludott’u keşfet"
        data-sky="#192437"
      >
        {(
          [
            [
              "ulujam",
              "UluJam",
              "Bir fikir. Bir takım. Bir oyun.",
              "ulujam",
              "UluJam içeriklerini aç",
            ],
            [
              "games",
              "Derece oyunları",
              "İlk üç oyun. Üç farklı dünya.",
              "community",
              "Derece oyunlarını aç",
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
              src={`/theme/reference/${art}.avif`}
              alt=""
              width={1080}
              height={1600}
              unoptimized
            />
            <span className="panel-play" aria-hidden="true">
              ▶
            </span>
            <span className="panel-caption">
              <span className="eyebrow">
                {id === "ulujam" ? "Birlikte üret" : "UluJam 2026"}
              </span>
              <strong>{title}</strong>
              <span>{description}</span>
              {id === "ulujam" && (
                <span className="panel-status">Başvurular henüz açılmadı.</span>
              )}
            </span>
          </button>
        ))}
      </section>
      <dialog
        ref={jam}
        id="story-ulujam"
        className="story-dialog"
        aria-label="UluJam"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="dialog-toolbar">
          <span>UluJam</span>
          <button onClick={close} data-close-story aria-label="İçeriği kapat">
            ×
          </button>
        </div>
        <div className="vlog-player" data-video-id="_ECGC1V__xo">
          {playing ? (
            <iframe
              src="https://www.youtube-nocookie.com/embed/_ECGC1V__xo?autoplay=1&rel=0"
              title="UluJam vlog"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              className="vlog-play"
              aria-label="Vlogu oynat"
              onClick={() => setPlaying(true)}
            >
              <Image
                src="/theme/reference/poster.avif"
                alt=""
                width={2560}
                height={1440}
                unoptimized
              />
              <span aria-hidden="true">▶</span>
            </button>
          )}
        </div>
        <div className="dialog-description">
          <div>
            <p className="eyebrow">Birlikte üret</p>
            <h2>UluJam vlog</h2>
          </div>
          <div>
            <p>UluJam’i birlikte yaşadığımız anlara bir bakış.</p>
            <p>
              Başvuru durumu kapalı. Güncel bilgi ve arşive UluJam sayfasından
              ulaşabilirsin.
            </p>
            <Link className="button secondary" href="/ulujam" onClick={close}>
              UluJam’i keşfet
            </Link>
            <a
              href="https://youtu.be/_ECGC1V__xo"
              target="_blank"
              rel="noopener noreferrer"
            >
              YouTube’da izle ↗
            </a>
          </div>
        </div>
      </dialog>
      <dialog
        ref={games}
        id="story-games"
        className="story-dialog"
        aria-label="Derece oyunları"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
      >
        <div className="dialog-toolbar">
          <span>UluJam 2026</span>
          <button onClick={close} data-close-story aria-label="İçeriği kapat">
            ×
          </button>
        </div>
        <div className="degree-dialog-cover">
          <Image
            src="/theme/reference/community.avif"
            alt=""
            width={1600}
            height={900}
            unoptimized
          />
          <h2>Derece oyunları</h2>
        </div>
        <div className="dialog-games">
          <p>UluJam 2026’nın doğrulanmış derece bağlantıları.</p>
          {degreeContent}
          <Link
            className="button secondary"
            href="/oyunlar#derece-oyunlari"
            onClick={close}
          >
            Tüm derece oyunları
          </Link>
        </div>
      </dialog>
    </>
  );
}
