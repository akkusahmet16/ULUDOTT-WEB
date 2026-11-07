"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { PageFlip } from "page-flip";
import type { FanzinIssue } from "../domain/fanzin-types.ts";

interface FlipbookReaderProps {
  readonly issue?: FanzinIssue | null;
  readonly initialPage?: number;
  readonly emptyTitle?: string;
  readonly emptyDesc?: string;
  readonly issueLabel?: string;
  readonly digitalReadyText?: string;
  readonly interactiveSoonText?: string;
}

async function loadPdfPages(pdfUrl: string): Promise<string[]> {
  if (typeof window === "undefined") return [];

  // 1. pdf.min.js yükle (yoksa)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(window as any).pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).pdfjsLib) {
        resolve();
        return;
      }
      const existing = document.querySelector('script[src*="pdf.min.js"]');
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("PDF.js yüklenemedi")));
        return;
      }
      const script = document.createElement("script");
      script.src = "/vendor/pdfjs/pdf.min.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("PDF.js kütüphanesi yüklenemedi"));
      document.head.appendChild(script);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjs = (window as any).pdfjsLib;
  if (!pdfjs) throw new Error("PDF.js hazır değil");

  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.js";
  }

  const doc = await pdfjs.getDocument({
    url: pdfUrl,
    disableRange: true,
    disableStream: true,
  }).promise;

  const count = doc.numPages;
  const rendered: string[] = [];

  for (let i = 1; i <= count; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) continue;

    await page.render({ canvasContext: ctx, viewport }).promise;
    rendered.push(canvas.toDataURL("image/webp", 0.92));
  }

  if (rendered.length === 1) {
    const blank = document.createElement("canvas");
    blank.width = 580;
    blank.height = 750;
    const bCtx = blank.getContext("2d");
    if (bCtx) {
      bCtx.fillStyle = "black";
      bCtx.fillRect(0, 0, 580, 750);
    }
    rendered.push(blank.toDataURL("image/webp", 0.8));
  }

  return rendered;
}

export function FlipbookReader({
  issue,
  initialPage = 1,
  emptyTitle,
  emptyDesc,
  issueLabel,
  digitalReadyText,
  interactiveSoonText,
}: FlipbookReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageFlipRef = useRef<PageFlip | null>(null);
  const currentPageRef = useRef<number>(initialPage > 0 ? initialPage - 1 : 0);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);

  const hasPages = Boolean(
    (issue?.pages && issue.pages.length >= 2) ||
    (issue?.pdfUrl && issue.pdfUrl !== "#" && issue.pdfUrl.trim() !== "")
  );

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
    setIsLoading(true);
    setLoadError(false);

    // React DOM senkronizasyonunu korumak için izole mount öğesi
    const mountEl = document.createElement("div");
    mountEl.className = "fanzin-pageflip-instance";
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(mountEl);

    const initPageFlip = async () => {
      try {
        const { PageFlip } = await import("page-flip");
        if (!isMounted) return;

        let pageImages = (issue?.pages ?? [])
          .map((p) => p.imageUrl)
          .filter((url): url is string => Boolean(url));

        // Eğer hazır sayfalar varsa önce ilk görselin erişilebilir olduğunu kontrol et (404 koruması)
        if (pageImages.length > 0 && !pageImages[0].startsWith("data:")) {
          const testOk = await new Promise<boolean>((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = pageImages[0];
          });

          if (!testOk) {
            // Statik sayfa görselleri bulunamadıysa (404), PDF'e yönel
            pageImages = [];
          }
        }

        // Eğer sayfa görselleri 2'den azsa ve PDF URL mevcutsa, PDF'ten dinamik render et
        if (pageImages.length < 2 && issue?.pdfUrl && issue.pdfUrl !== "#" && issue.pdfUrl.trim() !== "") {
          try {
            const renderedFromPdf = await loadPdfPages(issue.pdfUrl);
            if (renderedFromPdf.length > 0) {
              pageImages = renderedFromPdf;
            }
          } catch (pdfErr) {
            console.error("PDF sayfaları ayrıştırılırken hata:", pdfErr);
          }
        }

        if (!isMounted) return;

        if (pageImages.length === 0) {
          setIsLoading(false);
          setLoadError(true);
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
        if (isMounted) {
          setIsLoading(false);
          setLoadError(true);
        }
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
  }, [hasPages, issue?.pages, issue?.pdfUrl, playPageTurnAudio]);

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
              ✦
            </span>
            <h3 className="fanzin-empty-title">
              {emptyTitle}
            </h3>
            <p className="fanzin-empty-desc">
              {emptyDesc}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasPages || loadError) {
    return (
      <div className="fanzin-reader-container">
        <div className="fanzin-book-stage fanzin-stage-empty">
          <div className="fanzin-empty-card">
            <span className="fanzin-empty-icon" aria-hidden="true">
              ✦
            </span>
            <h3 className="fanzin-empty-title">
              {issueLabel ? `${issueLabel}: ${issue.title}` : issue.title}
            </h3>
            <p className="fanzin-empty-desc">
              {issue.pdfUrl && issue.pdfUrl !== "#"
                ? digitalReadyText
                : interactiveSoonText}
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
