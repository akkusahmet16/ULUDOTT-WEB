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

  // Ultra yüksek çözünürlüklü rasterizasyon:
  // Fanzin yazıları, tipografi, el çizimleri ve detaylar için 300+ DPI Retina kalitesi
  const dpr = typeof window !== "undefined" ? Math.max(window.devicePixelRatio || 1, 2) : 2;
  const targetScale = Math.min(3.8, Math.max(3.2, dpr * 1.6));

  for (let i = 1; i <= count; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: targetScale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) continue;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    await page.render({
      canvasContext: ctx,
      viewport,
      intent: "print",
    }).promise;

    // Yüksek kaliteli WebP (0.98) ile kayıpsız netlik ve pürüzsüz vektör kenarları
    rendered.push(canvas.toDataURL("image/webp", 0.98));
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

        let pageImages: string[] = [];
        let bodyPages: string[] = [];

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

        // 2. PDF URL varsa doğrudan PDF'ten yüksek kaliteli rasterize et
        if (issue?.pdfUrl && issue.pdfUrl !== "#" && issue.pdfUrl.trim() !== "") {
          try {
            const renderedFromPdf = await loadPdfPages(issue.pdfUrl);
            if (renderedFromPdf.length > 0) {
              bodyPages = renderedFromPdf;
            }
          } catch (pdfErr) {
            console.error("PDF sayfaları ayrıştırılırken hata:", pdfErr);
          }
        }

        // 3. PDF yoksa veya yüklenemediyse hazır statik sayfa kayıtlarına bak
        if (bodyPages.length === 0) {
          const staticPages = (issue?.pages ?? [])
            .map((p) => p.imageUrl)
            .filter((url): url is string => Boolean(url));

          if (staticPages.length >= 1) {
            const firstUrl = staticPages[0];
            const testOk = firstUrl.startsWith("data:")
              ? true
              : await new Promise<boolean>((resolve) => {
                  const img = new Image();
                  img.onload = () => resolve(true);
                  img.onerror = () => resolve(false);
                  img.src = firstUrl;
                });

            if (testOk) {
              bodyPages = staticPages;
            }
          }
        }

        // 4. Kapak görseli kuralı:
        // Yüklenen kapak görseli ilk sayfanın yerine GEÇMESİN.
        // Soldaki kısım ilk sayfada kapak görseli olsun.
        // PDF ilk sayfası yine sağda yer alsın.
        if (validCoverUrl) {
          pageImages = [validCoverUrl, ...bodyPages];
        } else {
          // Kapak yüklenmediyse ilk sayfayı asla boş gösterme:
          pageImages = [...bodyPages];
        }

        if (!isMounted) return;

        if (pageImages.length === 0) {
          setIsLoading(false);
          setLoadError(true);
          return;
        }

        // Tek sayfa durumunda güvenli çift sayfa görünümü için tamamla
        if (pageImages.length === 1) {
          pageImages = [pageImages[0], pageImages[0]];
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
          maxShadowOpacity: 0.35,
          showCover: false, // Sol tarafta kapak görseli, sağ tarafta PDF ilk sayfası olarak iki sayfa açık başlasın
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

        // CanvasUI ve CanvasRender High-DPI (Retina) optimizasyonu:
        // PageFlip varsayılan olarak canvas.width/height değerlerini 1x CSS pikseline
        // eşitlediğinden yüksek çözünürlüklü ekranlarda (Retina/4K) bulanıklaşma oluşur.
        // Canvas buffer'ını DPR çarpanı ile ölçeklendirip ctx.scale(dpr, dpr) uygulayarak
        // piksel piksel kristal netliğinde 300+ DPI render sağlıyoruz.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ui = (pageFlip as any).getUI();
        if (ui && typeof ui.resizeCanvas === "function") {
          ui.resizeCanvas = function () {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cvs = (this as any).canvas as HTMLCanvasElement | undefined;
            if (!cvs) return;
            const cs = getComputedStyle(cvs);
            const width =
              parseInt(cs.getPropertyValue("width"), 10) || cvs.clientWidth || 1160;
            const height =
              parseInt(cs.getPropertyValue("height"), 10) || cvs.clientHeight || 750;
            const dpr =
              typeof window !== "undefined"
                ? Math.max(window.devicePixelRatio || 1, 2)
                : 2;

            cvs.width = Math.round(width * dpr);
            cvs.height = Math.round(height * dpr);
          };
          ui.resizeCanvas();
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const render = (pageFlip as any).getRender();
        if (render) {
          // Sayfa boşken veya sayfa çevrilirken tüm tuvali beyaza boyayıp
          // boş alanları beyaz göstermek yerine saydam tut
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

              const dpr =
                typeof window !== "undefined"
                  ? Math.max(window.devicePixelRatio || 1, 2)
                  : 2;

              const cs = getComputedStyle(cvs);
              const cssW =
                parseInt(cs.getPropertyValue("width"), 10) || cvs.clientWidth || 1160;
              const cssH =
                parseInt(cs.getPropertyValue("height"), 10) || cvs.clientHeight || 750;
              const targetW = Math.round(cssW * dpr);
              const targetH = Math.round(cssH * dpr);

              if (cvs.width !== targetW || cvs.height !== targetH) {
                cvs.width = targetW;
                cvs.height = targetH;
              }

              ctx.save();
              ctx.scale(dpr, dpr);
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
