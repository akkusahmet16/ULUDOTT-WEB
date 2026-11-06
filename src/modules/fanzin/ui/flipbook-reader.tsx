"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { PageFlip } from "page-flip";
import type { FanzinIssue } from "../domain/fanzin-types.ts";

interface FlipbookReaderProps {
  readonly issue?: FanzinIssue | null;
  readonly initialPage?: number;
  readonly emptyTitle?: string;
  readonly emptyDesc?: string;
}

export function FlipbookReader({
  issue,
  initialPage = 1,
  emptyTitle,
  emptyDesc,
}: FlipbookReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageFlipRef = useRef<PageFlip | null>(null);
  const currentPageRef = useRef<number>(initialPage > 0 ? initialPage - 1 : 0);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const hasPages = Boolean(issue?.pages && issue.pages.length >= 2);

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
        void ctx.resume();
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
      // Tarayıcı ses kısıtlamalarını sessizce yönet
    }
  }, []);

  // PageFlip başlatma ve yaşam döngüsü
  useEffect(() => {
    if (!hasPages || !containerRef.current) return;

    let isMounted = true;
    let pageFlipInstance: PageFlip | null = null;

    // React DOM senkronizasyonunu korumak için izole mount öğesi
    const mountEl = document.createElement("div");
    mountEl.className = "fanzin-pageflip-instance";
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(mountEl);

    const initPageFlip = async () => {
      try {
        const { PageFlip } = await import("page-flip");
        if (!isMounted) return;

        const pageImages = (issue?.pages ?? [])
          .map((p) => p.imageUrl)
          .filter((url): url is string => Boolean(url));

        if (pageImages.length === 0) {
          setIsLoading(false);
          return;
        }

        // US Letter / A4 fanzin en-boy oranı (1224x1584 ~ 1:1.294)
        const pageFlip = new PageFlip(mountEl, {
          width: 580,
          height: 750,
          size: "stretch",
          minWidth: 320,
          maxWidth: 950,
          minHeight: 414,
          maxHeight: 1230,
          drawShadow: true,
          maxShadowOpacity: 0.5,
          showCover: true,
          usePortrait: true,
          showPageCorners: true,
          useMouseEvents: true,
          mobileScrollSupport: false,
          flippingTime: 700,
          startPage: currentPageRef.current,
        });

        pageFlipInstance = pageFlip;
        pageFlipRef.current = pageFlip;

        pageFlip.on("init", (e) => {
          if (!isMounted) return;
          setIsLoading(false);
          currentPageRef.current = e.data.page;
        });

        pageFlip.on("flip", (e) => {
          if (!isMounted) return;
          currentPageRef.current = e.data;
        });

        pageFlip.on("changeState", (e) => {
          if (!isMounted) return;
          if (e.data === "flipping") {
            playPageTurnAudio();
          }
        });

        pageFlip.loadFromImages(pageImages);
      } catch (err) {
        console.error("PageFlip yüklenirken hata oluştu:", err);
        if (isMounted) setIsLoading(false);
      }
    };

    void initPageFlip();

    return () => {
      isMounted = false;
      if (pageFlipInstance) {
        try {
          pageFlipInstance.destroy();
        } catch {
          // ignore
        }
        pageFlipRef.current = null;
      }
      mountEl.remove();
    };
  }, [hasPages, issue?.pages, playPageTurnAudio]);

  // Klavye sol/sağ ok tuşları ile sayfa çevirme
  useEffect(() => {
    if (!hasPages) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        pageFlipRef.current?.flipNext();
      } else if (e.key === "ArrowLeft") {
        pageFlipRef.current?.flipPrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasPages]);

  if (!issue) {
    return (
      <div className="fanzin-reader-container">
        <div className="fanzin-book-stage fanzin-stage-empty">
          <div className="fanzin-empty-card">
            <span className="fanzin-empty-icon" aria-hidden="true">
              📖
            </span>
            <h3 className="fanzin-empty-title">
              {emptyTitle || "Henüz Yayımlanmış Sayı Yok"}
            </h3>
            <p className="fanzin-empty-desc">
              {emptyDesc ||
                "Çok yakında ilk sayımız burada çevrimiçi olarak okunabilecek. Yeni sayılar çıktığında doğrudan bu ekrandan sayfaları çevirerek okuyabilirsiniz."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasPages) {
    return (
      <div className="fanzin-reader-container">
        <div className="fanzin-book-stage fanzin-stage-empty">
          <div className="fanzin-empty-card">
            <span className="fanzin-empty-icon" aria-hidden="true">
              📄
            </span>
            <h3 className="fanzin-empty-title">
              Sayı #{String(issue.issueNumber).padStart(2, "0")}: {issue.title}
            </h3>
            <p className="fanzin-empty-desc">
              Bu sayı yayımlandı! İnteraktif çevrimiçi sayfalar çok yakında bu ekranda okunabilecek.
              {issue.pdfUrl && issue.pdfUrl !== "#"
                ? " Dilerseniz yukarıdaki butondan PDF baskısını hemen cihazınıza indirebilirsiniz."
                : ""}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fanzin-reader-container">
      <div className="fanzin-book-stage">
        {/* PageFlip Canvas Sahnesi (GTA VI Neon Estetiği) */}
        <div className="fanzin-pageflip-wrapper">
          {isLoading && (
            <div className="fanzin-reader-loading" aria-live="polite">
              <div className="fanzin-loading-spinner" />
            </div>
          )}
          <div ref={containerRef} className="fanzin-pageflip-container" />
        </div>
      </div>
    </div>
  );
}
