"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { PageFlip } from "page-flip";
import type { FanzinIssue } from "../domain/fanzin-types.ts";
import { trackSiteEvent } from "../../../lib/analytics/tracker.ts";

interface FlipbookReaderProps {
  readonly issue?: FanzinIssue | null;
  readonly initialPage?: number;
  readonly emptyTitle?: string;
  readonly emptyDesc?: string;
  readonly issueLabel?: string;
  readonly digitalReadyText?: string;
  readonly interactiveSoonText?: string;
}

const PLACEHOLDER_PAGE_URL = "/images/fanzin/placeholder.svg";
const BACK_COVER_PAGE_URL = "/images/fanzin/backcover.svg";

// PDF.js kütüphanesini dinamik olarak yükle
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensurePdfJs(): Promise<any> {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Promise<any>((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).pdfjsLib) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolve((window as any).pdfjsLib);
      return;
    }
    const existing = document.querySelector('script[src*="pdf.min.js"]');
    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      existing.addEventListener("load", () => resolve((window as any).pdfjsLib));
      existing.addEventListener("error", () => reject(new Error("PDF.js yüklenemedi")));
      return;
    }
    const script = document.createElement("script");
    script.src = "/vendor/pdfjs/pdf.min.js";
    script.async = true;
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lib = (window as any).pdfjsLib;
      if (lib?.GlobalWorkerOptions) {
        lib.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.js";
      }
      resolve(lib);
    };
    script.onerror = () => reject(new Error("PDF.js kütüphanesi yüklenemedi"));
    document.head.appendChild(script);
  });
}

// Tek bir PDF sayfasını yüksek kaliteli WebP Blob URL'sine dönüştür
async function renderSinglePdfPage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  pageNum: number,
  targetScale: number
): Promise<string> {
  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale: targetScale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas 2D context oluşturulamadı");

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  await page.render({
    canvasContext: ctx,
    viewport,
    intent: "print",
  }).promise;

  return new Promise<string>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(canvas.toDataURL("image/webp", 0.95));
        }
      },
      "image/webp",
      0.95
    );
  });
}

// PageFlip içindeki belirli bir sayfa görselini dinamik ve kesintisiz güncelle
function updatePageInFlip(pageFlip: PageFlip | null, index: number, imageUrl: string) {
  if (!pageFlip) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collection = (pageFlip as any).getPageCollection?.();
    if (collection) {
      const pageObj = collection.getPage(index);
      if (pageObj && pageObj.image) {
        pageObj.image.src = imageUrl;
        if (pageObj.image.complete) {
          pageObj.isLoad = true;
        } else {
          pageObj.isLoad = false;
          pageObj.image.onload = () => {
            pageObj.isLoad = true;
            try {
              pageFlip.update();
            } catch {
              // ignore
            }
          };
        }
        try {
          pageFlip.update();
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }
}

// CanvasUI ve CanvasRender High-DPI (Retina/4K) optimizasyon kancalarını uygula
function applyHighDpiHooks(pageFlip: PageFlip) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ui = (pageFlip as any).getUI?.();
  if (ui && typeof ui.resizeCanvas === "function") {
    ui.resizeCanvas = function () {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cvs = (this as any).canvas as HTMLCanvasElement | undefined;
      if (!cvs) return;
      const cs = getComputedStyle(cvs);
      const width = parseInt(cs.getPropertyValue("width"), 10) || cvs.clientWidth || 1160;
      const height = parseInt(cs.getPropertyValue("height"), 10) || cvs.clientHeight || 750;
      const ratio = typeof window !== "undefined" ? Math.max(window.devicePixelRatio || 1, 2) : 2;
      cvs.width = Math.round(width * ratio);
      cvs.height = Math.round(height * ratio);
    };
    ui.resizeCanvas();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const render = (pageFlip as any).getRender?.();
  if (render) {
    render.clear = function () {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = (this as any).ctx as CanvasRenderingContext2D | undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cvs = (this as any).canvas as HTMLCanvasElement | undefined;
      if (ctx && cvs) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        ctx.restore();
      }
    };

    if (typeof render.drawFrame === "function") {
      const origDrawFrame = render.drawFrame.bind(render);
      render.drawFrame = function () {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cvs = (this as any).canvas as HTMLCanvasElement | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctx = (this as any).ctx as CanvasRenderingContext2D | undefined;
        if (!cvs || !ctx) {
          origDrawFrame();
          return;
        }
        const ratio = typeof window !== "undefined" ? Math.max(window.devicePixelRatio || 1, 2) : 2;
        const cs = getComputedStyle(cvs);
        const cssW = parseInt(cs.getPropertyValue("width"), 10) || cvs.clientWidth || 1160;
        const cssH = parseInt(cs.getPropertyValue("height"), 10) || cvs.clientHeight || 750;
        const targetW = Math.round(cssW * ratio);
        const targetH = Math.round(cssH * ratio);

        if (cvs.width !== targetW || cvs.height !== targetH) {
          cvs.width = targetW;
          cvs.height = targetH;
        }

        ctx.save();
        ctx.scale(ratio, ratio);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        origDrawFrame();
        ctx.restore();
      };
    }
  }

  try {
    pageFlip.update();
  } catch {
    // ignore
  }
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
  const createdBlobUrlsRef = useRef<string[]>([]);

  const [loadError, setLoadError] = useState<boolean>(false);
  const hasTrackedViewRef = useRef<string | null>(null);

  useEffect(() => {
    if (!issue || !issue.id || hasTrackedViewRef.current === issue.id) return;
    hasTrackedViewRef.current = issue.id;
    trackSiteEvent(
      "fanzin_view",
      `Fanzin Görüntülendi: #${issue.issueNumber} - ${issue.title}`,
      {
        issueId: issue.id,
        issueNumber: issue.issueNumber,
        title: issue.title,
      },
    );
  }, [issue]);

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

  // PageFlip başlatma, aşamalı yükleme ve yaşam döngüsü
  useEffect(() => {
    if (!hasPages || !containerRef.current) return;

    let isMounted = true;
    let pageFlipInstance: PageFlip | null = null;
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

        // 1. Kapak görseli var mı ve erişilebilir mi kontrol et
        const candidateCover =
          issue?.coverImageUrl &&
          issue.coverImageUrl.trim() !== "" &&
          issue.coverImageUrl !== "#"
            ? issue.coverImageUrl.trim()
            : null;

        let validCoverUrl: string | null = null;
        if (candidateCover) {
          const coverOk = candidateCover.startsWith("data:")
            ? true
            : await new Promise<boolean>((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = candidateCover;
              });
          if (coverOk) {
            validCoverUrl = candidateCover;
          }
        }

        let pageImages: string[] = [];
        const hasPdf = Boolean(issue?.pdfUrl && issue.pdfUrl !== "#" && issue.pdfUrl.trim() !== "");

        // 2. PDF varsa: İlk sayfaları hemen render edip okuyucuyu anında aç, kalanları arka planda akıt
        if (hasPdf && issue?.pdfUrl) {
          const pdfjs = await ensurePdfJs();
          if (!pdfjs) throw new Error("PDF.js kütüphanesi yüklenemedi");

          // HTTP Range ve stream desteği ile tüm 30 sayfayı indirmeden sadece ilk kısmı çek
          const doc = await pdfjs.getDocument({
            url: issue.pdfUrl,
            cMapUrl: "/vendor/pdfjs/cmaps/",
            cMapPacked: true,
          }).promise;

          if (!isMounted) return;

          const totalPdfPages = doc.numPages;
          const hasCover = Boolean(validCoverUrl);
          const totalPages = hasCover ? totalPdfPages + 1 : totalPdfPages;
          // Çift sayfa açılışını simetrik tutmak için tek sayılı sayfalarda arka kapak ekle
          const paddedTotalPages = totalPages % 2 !== 0 ? totalPages + 1 : totalPages;

          pageImages = new Array(paddedTotalPages);
          const renderedPdfPages = new Map<number, string>();

          // İlk olarak tüm sayfaları şık iskelet SVG yer tutucularıyla doldur
          for (let i = 0; i < paddedTotalPages; i++) {
            if (hasCover && i === 0) {
              pageImages[i] = validCoverUrl!;
            } else if (hasCover && i === paddedTotalPages - 1 && totalPages !== paddedTotalPages) {
              pageImages[i] = BACK_COVER_PAGE_URL;
            } else {
              pageImages[i] = PLACEHOLDER_PAGE_URL;
            }
          }

          // Retina ve Yüksek DPI ekranlar için ideal optimizasyon ölçeği
          const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2.5) : 2;
          const targetScale = Math.min(2.5, Math.max(1.8, dpr * 1.15));

          // İLK AÇILIŞ: İlk spread (Kapak + 1. Sayfa veya 1. + 2. Sayfa) anında render edilir
          if (hasCover) {
            try {
              const page1Url = await renderSinglePdfPage(doc, 1, targetScale);
              pageImages[1] = page1Url;
              renderedPdfPages.set(1, page1Url);
              createdBlobUrlsRef.current.push(page1Url);
            } catch (err) {
              console.warn("PDF 1. sayfa oluşturulurken hata:", err);
            }
          } else {
            try {
              const page1Url = await renderSinglePdfPage(doc, 1, targetScale);
              pageImages[0] = page1Url;
              renderedPdfPages.set(1, page1Url);
              createdBlobUrlsRef.current.push(page1Url);

              if (totalPdfPages >= 2) {
                const page2Url = await renderSinglePdfPage(doc, 2, targetScale);
                pageImages[1] = page2Url;
                renderedPdfPages.set(2, page2Url);
                createdBlobUrlsRef.current.push(page2Url);
              }
            } catch (err) {
              console.warn("PDF ilk sayfalar oluşturulurken hata:", err);
            }
          }

          if (!isMounted) return;

          // PageFlip örneğini hemen başlat (Okuyucu yükleme simgesi olmadan anında açılır)
          const pageFlip = new PageFlip(mountEl, {
            width: 580,
            height: 750,
            size: "stretch",
            minWidth: 320,
            maxWidth: 950,
            minHeight: 414,
            maxHeight: 1230,
            drawShadow: true,
            maxShadowOpacity: 0.35,
            showCover: false, // Sol tarafta kapak görseli, sağ tarafta 1. sayfa açık başlasın
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
            currentPageRef.current = e.data.page;
          });

          pageFlip.on("flip", (e) => {
            if (!isMounted) return;
            currentPageRef.current = e.data;
            try {
              pageFlip.update();
            } catch {
              // ignore
            }
          });

          pageFlip.on("changeState", (e) => {
            if (!isMounted) return;
            if (e.data === "flipping") {
              playPageTurnAudio();
            }
          });

          pageFlip.loadFromImages(pageImages);
          applyHighDpiHooks(pageFlip);

          // 3. ARKA PLAN İŞLEYİCİSİ (Aşamalı / Zamanla Yükleme):
          // Kalan sayfaları ana iş parçacığını (UI thread) dondurmadan, kullanıcının
          // okuduğu sayfaya göre önceliklendirerek arka planda birer birer render et
          const startBackgroundRendering = async () => {
            while (isMounted && renderedPdfPages.size < totalPdfPages) {
              const currentSpread = currentPageRef.current;
              const currentPdf = hasCover ? currentSpread : currentSpread + 1;

              // Kullanıcının baktığı sayfa ve hemen sonraki sayfalar en yüksek önceliğe sahiptir
              const priorityCandidates: number[] = [
                currentPdf,
                currentPdf + 1,
                currentPdf + 2,
                currentPdf + 3,
                currentPdf - 1,
                currentPdf - 2,
              ];

              for (let p = 1; p <= totalPdfPages; p++) {
                priorityCandidates.push(p);
              }

              const nextPdfPage = priorityCandidates.find(
                (p) => p >= 1 && p <= totalPdfPages && !renderedPdfPages.has(p)
              );

              if (!nextPdfPage) break;

              try {
                const blobUrl = await renderSinglePdfPage(doc, nextPdfPage, targetScale);
                if (!isMounted) {
                  URL.revokeObjectURL(blobUrl);
                  break;
                }

                renderedPdfPages.set(nextPdfPage, blobUrl);
                createdBlobUrlsRef.current.push(blobUrl);

                const targetIndex = hasCover ? nextPdfPage : nextPdfPage - 1;
                if (targetIndex >= 0 && targetIndex < pageImages.length) {
                  pageImages[targetIndex] = blobUrl;
                  updatePageInFlip(pageFlipRef.current, targetIndex, blobUrl);
                }
              } catch (renderErr) {
                console.warn(`Sayfa ${nextPdfPage} arka planda render edilirken hata:`, renderErr);
                renderedPdfPages.set(nextPdfPage, "error");
              }

              // UI thread'in 60 FPS akıcı kalması ve sayfa çevirme animasyonlarının donmaması için 25ms bekleme ver
              await new Promise((resolve) => setTimeout(resolve, 25));
            }
          };

          void startBackgroundRendering();
          return;
        }

        // 3. PDF yoksa hazır statik sayfa kayıtlarına bak
        const staticPages = (issue?.pages ?? [])
          .map((p) => p.imageUrl)
          .filter((url): url is string => Boolean(url));

        let bodyPages: string[] = [];
        if (staticPages.length >= 1) {
          bodyPages = staticPages;
        }

        if (validCoverUrl) {
          pageImages = [validCoverUrl, ...bodyPages];
        } else {
          pageImages = [...bodyPages];
        }

        if (!isMounted) return;

        if (pageImages.length === 0) {
          setLoadError(true);
          return;
        }

        if (pageImages.length === 1) {
          pageImages = [pageImages[0], pageImages[0]];
        }

        const pageFlip = new PageFlip(mountEl, {
          width: 580,
          height: 750,
          size: "stretch",
          minWidth: 320,
          maxWidth: 950,
          minHeight: 414,
          maxHeight: 1230,
          drawShadow: true,
          maxShadowOpacity: 0.35,
          showCover: false,
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
        applyHighDpiHooks(pageFlip);
      } catch (err) {
        console.error("PageFlip başlatılırken hata oluştu:", err);
        if (isMounted) {
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
      // Bellek sızıntılarını önlemek için oluşturulan tüm Blob URL'lerini serbest bırak
      const urlsToRevoke = [...createdBlobUrlsRef.current];
      createdBlobUrlsRef.current = [];
      for (const u of urlsToRevoke) {
        try {
          URL.revokeObjectURL(u);
        } catch {
          // ignore
        }
      }
      mountEl.remove();
    };
  }, [hasPages, issue?.pages, issue?.pdfUrl, issue?.coverImageUrl, issue?.pageCount, playPageTurnAudio]);

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
            <h3 className="fanzin-empty-title">{emptyTitle}</h3>
            <p className="fanzin-empty-desc">{emptyDesc}</p>
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
        {/* PageFlip Canvas Sahnesi (GTA VI Neon Estetiği - Doğrudan ve İkonsuz Açılış) */}
        <div className="fanzin-pageflip-wrapper">
          <div ref={containerRef} className="fanzin-pageflip-container" />
        </div>
      </div>
    </div>
  );
}
