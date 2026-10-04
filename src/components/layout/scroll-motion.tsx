"use client";
import { useEffect } from "react";
export function ScrollMotion() {
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;
    const sections = [
      ...document.querySelectorAll<HTMLElement>(
        "main section:not(.game-break)",
      ),
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("motion-visible");
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.08 },
    );
    for (const section of sections) {
      section.classList.add("cinematic-section");
      observer.observe(section);
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      document.documentElement.style.setProperty(
        "--page-scroll",
        String(preference.matches ? 0 : Math.min(scrollY / 700, 1)),
      );
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    addEventListener("scroll", scroll, { passive: true });
    update();
    const reduce = () => {
      if (preference.matches) {
        sections.forEach((s) => s.classList.add("motion-visible"));
        document.documentElement.style.setProperty("--page-scroll", "0");
      }
    };
    preference.addEventListener("change", reduce);
    return () => {
      observer.disconnect();
      removeEventListener("scroll", scroll);
      cancelAnimationFrame(frame);
      preference.removeEventListener("change", reduce);
    };
  }, []);
  return null;
}
