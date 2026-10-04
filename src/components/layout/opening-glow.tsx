"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import styles from "../../styles/home.module.css";

export function OpeningGlow({ children }: { children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  function follow(event: PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType !== "mouse" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--glow-x",
      `${((event.clientX - bounds.left) / bounds.width - 0.5) * 110}px`,
    );
    event.currentTarget.style.setProperty(
      "--glow-y",
      `${((event.clientY - bounds.top) / bounds.height - 0.5) * 70}px`,
    );
  }
  function reset() {
    frame.current?.style.removeProperty("--glow-x");
    frame.current?.style.removeProperty("--glow-y");
  }
  return (
    <div
      ref={frame}
      className={styles.posterFrame}
      onPointerMove={follow}
      onPointerLeave={reset}
    >
      <span className={styles.posterGlow} aria-hidden="true" />
      {children}
    </div>
  );
}
