"use client";
import { useEffect, useRef } from "react";
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
      if (!video.seeking && Math.abs(video.currentTime - target) > 0.035)
        video.currentTime = target;
    };
    const update = () => {
      frame = 0;
      if (preference.matches || document.hidden) return;
      const r = video.getBoundingClientRect();
      const progress = Math.max(
        0,
        Math.min(1, (innerHeight - r.top) / (innerHeight + r.height)),
      );
      if (near && !loaded) {
        loaded = true;
        video.preload = "auto";
        video.load();
      }
      if (Number.isFinite(video.duration))
        target = progress * Math.max(0, video.duration - 0.04);
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
