"use client";
import { useEffect, useRef, useState } from "react";
export function SceneVideo({
  src,
  poster,
  label,
}: {
  src: string;
  poster: string;
  label: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const manualPause = useRef(false);
  const [paused, setPaused] = useState(true);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    const sync = () => {
      if (
        inView &&
        !manualPause.current &&
        !preference.matches &&
        !document.hidden
      )
        void video.play().catch(() => {});
      else video.pause();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[0].isIntersecting;
        sync();
      },
      { threshold: 0.35 },
    );
    observer.observe(video);
    document.addEventListener("visibilitychange", sync);
    preference.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      video.pause();
      document.removeEventListener("visibilitychange", sync);
      preference.removeEventListener("change", sync);
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
        loop
        preload="none"
        aria-label={label}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
      />
      <button
        className="scene-video-toggle"
        aria-label={paused ? "Videoyu oynat" : "Videoyu duraklat"}
        onClick={() => {
          if (ref.current?.paused) {
            manualPause.current = false;
            void ref.current.play().catch(() => {});
          } else {
            manualPause.current = true;
            ref.current?.pause();
          }
        }}
      >
        {paused ? "▶" : "Ⅱ"}
      </button>
      <span className="scene-video-label">GTA VI görsel referansı</span>
    </div>
  );
}
