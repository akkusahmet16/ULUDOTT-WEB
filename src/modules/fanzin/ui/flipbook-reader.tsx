"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import type { FanzinIssue } from "../domain/fanzin-types.ts";

interface FlipbookReaderProps {
  readonly issue: FanzinIssue;
  readonly initialPage?: number;
  readonly labels: {
    readonly prevPage: string;
    readonly nextPage: string;
    readonly singlePageView: string;
    readonly spreadView: string;
  };
}

export function FlipbookReader({
  issue,
  initialPage = 1,
  labels,
}: FlipbookReaderProps) {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [isFlipping, setIsFlipping] = useState<"forward" | "backward" | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"spread" | "single">("single");

  // Responsive cihaz genişliği kontrolü
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);
      if (mobile) {
        setViewMode("single");
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Web Audio API ile gerçekçi kağıt çevirme sesi
  const playPageTurnAudio = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const duration = 0.16;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const progress = i / bufferSize;
        const envelope =
          Math.sin(progress * Math.PI) * Math.exp(-progress * 2.5);
        data[i] = (Math.random() * 2 - 1) * envelope * 0.45;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {
      // Etkileşim öncesi tarayıcı ses kısıtlamalarını sessizce yut
    }
  }, []);

  const isSinglePage = isMobile || viewMode === "single";
  const step = isSinglePage ? 1 : 2;

  // Sayfa çevirme aksiyonları
  const turnNext = useCallback(() => {
    if (isFlipping) return;
    if (currentPage + step <= issue.pageCount) {
      setIsFlipping("forward");
      playPageTurnAudio();
      setTimeout(() => {
        setCurrentPage((prev) => Math.min(prev + step, issue.pageCount));
        setIsFlipping(null);
      }, 550);
    }
  }, [currentPage, isFlipping, issue.pageCount, playPageTurnAudio, step]);

  const turnPrev = useCallback(() => {
    if (isFlipping) return;
    if (currentPage > 1) {
      setIsFlipping("backward");
      playPageTurnAudio();
      setTimeout(() => {
        setCurrentPage((prev) => Math.max(1, prev - step));
        setIsFlipping(null);
      }, 550);
    }
  }, [currentPage, isFlipping, playPageTurnAudio, step]);

  // Klavye ok tuşları ile gezinti
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        turnNext();
      } else if (e.key === "ArrowLeft") {
        turnPrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [turnNext, turnPrev]);

  // Dokunmatik cihazlar için sağ/sol kaydırma
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0]?.clientX ?? 0;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) {
      turnNext();
    } else if (diff < -50) {
      turnPrev();
    }
    touchStartX.current = null;
  };

  // Aktif gösterilen sayfalar
  const leftPageNum = currentPage;
  const rightPageNum = isSinglePage
    ? null
    : Math.min(currentPage + 1, issue.pageCount);

  const leftPageData = issue.pages.find((p) => p.pageNumber === leftPageNum);
  const rightPageData = rightPageNum
    ? issue.pages.find((p) => p.pageNumber === rightPageNum)
    : null;

  const renderPage = (
    pageData: (typeof issue.pages)[number] | undefined | null,
    isRight: boolean,
  ) => {
    if (!pageData) {
      return (
        <div
          className={`fanzin-book-page ${isSinglePage ? "fanzin-single-page" : isRight ? "fanzin-right-page" : "fanzin-left-page"}`}
        >
          <div className="fanzin-page-blank" />
        </div>
      );
    }

    return (
      <div
        className={`fanzin-book-page ${isSinglePage ? "fanzin-single-page" : isRight ? "fanzin-right-page" : "fanzin-left-page"}`}
        onClick={isRight ? turnNext : turnPrev}
        role="button"
        tabIndex={0}
        aria-label={isRight ? labels.nextPage : labels.prevPage}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            if (isRight) turnNext();
            else turnPrev();
          }
        }}
      >
        {pageData.imageUrl ? (
          <Image
            src={pageData.imageUrl}
            alt=""
            width={1200}
            height={1700}
            className="fanzin-page-image"
            priority={pageData.pageNumber <= 2}
            sizes="(max-width: 900px) 100vw, 850px"
          />
        ) : (
          <div className="fanzin-page-blank" />
        )}
      </div>
    );
  };

  return (
    <div
      className="fanzin-reader-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Görünüm Modu Değiştirici (Masaüstü için Tek / Çift Sayfa) */}
      {!isMobile && (
        <div className="fanzin-reader-toolbar">
          <div className="fanzin-view-toggle" role="group" aria-label="Görünüm modu">
            <button
              type="button"
              className={`fanzin-toggle-btn ${viewMode === "single" ? "active" : ""}`}
              onClick={() => setViewMode("single")}
              aria-pressed={viewMode === "single"}
            >
              📄 {labels.singlePageView}
            </button>
            <button
              type="button"
              className={`fanzin-toggle-btn ${viewMode === "spread" ? "active" : ""}`}
              onClick={() => setViewMode("spread")}
              aria-pressed={viewMode === "spread"}
            >
              📖 {labels.spreadView}
            </button>
          </div>
        </div>
      )}

      <div className="fanzin-book-stage">
        {/* Sol sayfa çevirme oku */}
        <button
          type="button"
          className="fanzin-side-arrow fanzin-side-arrow-left"
          onClick={turnPrev}
          disabled={currentPage <= 1 || isFlipping !== null}
          aria-label={labels.prevPage}
        >
          ‹
        </button>

        {/* 3D Kitap Gövdesi (Ekrana Oranla Büyük Ölçek) */}
        <div
          className={`fanzin-book-frame ${isSinglePage ? "fanzin-single-frame" : "fanzin-spread-frame"}`}
        >
          {/* Sol Sayfa (Tek sayfada merkez sayfa) */}
          {renderPage(leftPageData, false)}

          {/* Orta Dikiş / Cilt Gölgelendirmesi (Sadece Çift Sayfada) */}
          {!isSinglePage && (
            <div className="fanzin-book-spine" aria-hidden="true">
              <div className="fanzin-book-spine-line" />
            </div>
          )}

          {/* Sağ Sayfa (Çift Sayfa Modunda) */}
          {!isSinglePage && renderPage(rightPageData, true)}

          {/* 3D Sayfa Çevirme Animasyon Yaprağı */}
          {isFlipping === "forward" && (
            <div
              className={`fanzin-flipping-leaf fanzin-flip-forward ${isSinglePage ? "fanzin-leaf-single" : ""}`}
              aria-hidden="true"
            >
              <div className="fanzin-book-page fanzin-flipping-page">
                {(isSinglePage ? leftPageData : rightPageData)?.imageUrl && (
                  <Image
                    src={(isSinglePage ? leftPageData : rightPageData)!.imageUrl!}
                    alt=""
                    width={1200}
                    height={1700}
                    className="fanzin-page-image"
                    sizes="850px"
                  />
                )}
              </div>
            </div>
          )}
          {isFlipping === "backward" && (
            <div
              className={`fanzin-flipping-leaf fanzin-flip-backward ${isSinglePage ? "fanzin-leaf-single" : ""}`}
              aria-hidden="true"
            >
              <div className="fanzin-book-page fanzin-flipping-page">
                {leftPageData?.imageUrl && (
                  <Image
                    src={leftPageData.imageUrl}
                    alt=""
                    width={1200}
                    height={1700}
                    className="fanzin-page-image"
                    sizes="850px"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sağ sayfa çevirme oku */}
        <button
          type="button"
          className="fanzin-side-arrow fanzin-side-arrow-right"
          onClick={turnNext}
          disabled={currentPage >= issue.pageCount || isFlipping !== null}
          aria-label={labels.nextPage}
        >
          ›
        </button>
      </div>
    </div>
  );
}
