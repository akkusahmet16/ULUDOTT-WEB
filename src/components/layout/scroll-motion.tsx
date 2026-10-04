"use client";
import { useEffect } from "react";
export function ScrollMotion() {
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const sections = [
      ...document.querySelectorAll<HTMLElement>(
        "main section:not(.game-break):not(.people-story):not(.people-chapter)",
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
    if (!preference.matches)
      for (const section of sections) {
        section.classList.add("cinematic-section");
        observer.observe(section);
      }
    let stages = [...document.querySelectorAll<HTMLElement>("main [data-sky]")];
    if (!stages.length) {
      stages = [
        ...document.querySelectorAll<HTMLElement>("main > .wrap > section"),
      ];
      const colors = ["#0c0d1b", "#213949", "#382e40", "#313929"];
      stages.forEach((stage, i) => {
        stage.dataset.sky = colors[i % colors.length];
      });
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const center = innerHeight * 0.48;
      const stage =
        stages.find((s) => {
          const r = s.getBoundingClientRect();
          return r.top <= center && r.bottom > center;
        }) ??
        stages.filter((s) => s.getBoundingClientRect().top <= center).at(-1);
      document.documentElement.style.setProperty(
        "--scene-bg",
        stage?.dataset.sky ?? "#0c0d1b",
      );
      document.documentElement.style.setProperty(
        "--page-scroll",
        String(preference.matches ? 0 : Math.min(scrollY / 700, 1)),
      );
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const reduce = () => {
      if (preference.matches)
        sections.forEach((s) => s.classList.add("motion-visible"));
      update();
    };
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("resize", scroll);
    preference.addEventListener("change", reduce);
    update();
    return () => {
      observer.disconnect();
      removeEventListener("scroll", scroll);
      removeEventListener("resize", scroll);
      cancelAnimationFrame(frame);
      preference.removeEventListener("change", reduce);
      document.documentElement.style.removeProperty("--scene-bg");
      document.documentElement.style.removeProperty("--page-scroll");
    };
  }, []);
  return null;
}
