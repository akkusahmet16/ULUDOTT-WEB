"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import styles from "./past-events-carousel.module.css";

export type PastEventSlide = { id: string; title: string; content: ReactNode };
export function PastEventsCarousel({ slides }: { slides: PastEventSlide[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const count = slides.length;
  const goTo = useCallback(
    (index: number) => {
      const next = (index + count) % count;
      track.current?.scrollTo({
        left: next * track.current.clientWidth,
        behavior: reducedMotion ? "instant" : "smooth",
      });
    },
    [count, reducedMotion],
  );

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setReducedMotion(preference.matches);
      setPaused(preference.matches);
    };
    const updateVisibility = () => setHidden(document.hidden);
    updatePreference();
    updateVisibility();
    preference.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    if (track.current) observer.observe(track.current);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);
  useEffect(() => {
    if (count < 2 || paused || hovered || !visible || hidden) return;
    const timer = setTimeout(() => goTo(active + 1), 5000);
    return () => clearTimeout(timer);
  }, [active, count, goTo, hidden, hovered, paused, visible]);
  useEffect(() => {
    const resize = () =>
      track.current?.scrollTo({
        left: active * track.current.clientWidth,
        behavior: "instant",
      });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [active]);

  return (
    <div
      className={styles.carousel}
      role="region"
      aria-label="Geçmiş etkinlikler galerisi"
      aria-roledescription="slayt gösterisi"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={(event) => {
        if (!(event.target as HTMLElement).closest("[data-autoplay-control]"))
          setPaused(true);
      }}
    >
      <div
        ref={track}
        className={styles.track}
        role="group"
        aria-label="Etkinlikleri kaydır"
        tabIndex={count > 1 ? 0 : undefined}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          goTo(active + (event.key === "ArrowRight" ? 1 : -1));
        }}
        onScroll={() => {
          if (!track.current?.clientWidth) return;
          setActive(
            Math.max(
              0,
              Math.min(
                count - 1,
                Math.round(
                  track.current.scrollLeft / track.current.clientWidth,
                ),
              ),
            ),
          );
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={styles.slide}
            role="group"
            aria-roledescription="slayt"
            aria-label={`${index + 1} / ${count}: ${slide.title}`}
            aria-hidden={index !== active}
            inert={index !== active}
          >
            {slide.content}
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className={styles.controls}>
          <div className={styles.navigation}>
            <button
              type="button"
              aria-label="Önceki etkinlik"
              onClick={() => goTo(active - 1)}
            >
              ←
            </button>
            <p aria-live={paused ? "polite" : "off"} aria-atomic="true">
              {active + 1} / {count}
            </p>
            <button
              type="button"
              aria-label="Sonraki etkinlik"
              onClick={() => goTo(active + 1)}
            >
              →
            </button>
          </div>
          <button
            type="button"
            data-autoplay-control
            aria-label={
              paused ? "Otomatik geçişi başlat" : "Otomatik geçişi duraklat"
            }
            onClick={() => setPaused(!paused)}
          >
            <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>{" "}
            {paused ? "Otomatik geçişi başlat" : "Otomatik geçişi duraklat"}
          </button>
        </div>
      )}
    </div>
  );
}
