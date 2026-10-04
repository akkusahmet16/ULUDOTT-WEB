"use client";
import { useEffect, useRef } from "react";
import { getPinnedVideoTime } from "../../../public/theme/scene-scroll.js";
export function SceneVideo({
  src,
  poster,
  label,
  reference = true,
}: {
  src: string;
  poster: string;
  label: string;
  reference?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      near = false,
      loaded = false,
      target = 0;
    const seek = () => {
      if (
        preference.matches ||
        document.hidden ||
        !Number.isFinite(video.duration) ||
        video.duration <= 0
      )
        return;
      video.pause();
      if (!video.seeking && Math.abs(video.currentTime - target) > 1 / 120)
        video.currentTime = target;
    };
    const update = () => {
      frame = 0;
      if (preference.matches || document.hidden) return;
      const hero = video.closest<HTMLElement>(".people-hero");
      const track = video.closest<HTMLElement>(".people-video-track");
      if (!hero || !track) return;
      const h = hero.getBoundingClientRect(),
        t = track.getBoundingClientRect();
      target = getPinnedVideoTime({
        trackTop: t.top,
        trackHeight: t.height,
        heroTop: h.top,
        heroHeight: h.height,
        viewportHeight: innerHeight,
        duration: video.duration,
      });
      if (near && !loaded) {
        loaded = true;
        video.preload = "auto";
        video.load();
      }
      seek();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        near = entries[0].isIntersecting;
        schedule();
      },
      { rootMargin: "300px" },
    );
    observer.observe(video);
    video.addEventListener("loadedmetadata", schedule);
    video.addEventListener("seeked", seek);
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    preference.addEventListener("change", schedule);
    schedule();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      video.pause();
      video.removeEventListener("loadedmetadata", schedule);
      video.removeEventListener("seeked", seek);
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      preference.removeEventListener("change", schedule);
    };
  }, []);
  return (
    <div className="scene-video">
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        playsInline
        preload="none"
        aria-label={label}
      />
      <span className="scene-video-label">
        Kaydırarak ilerle{reference ? " · GTA VI görsel referansı" : ""}
      </span>
    </div>
  );
}
