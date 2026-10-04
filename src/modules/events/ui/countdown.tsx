"use client";
import { useEffect, useState } from "react";
export type CountdownState =
  | { kind: "coming_soon" }
  | { kind: "counting"; seconds: number }
  | { kind: "started" };
export function countdownState(
  publishedStartAt: Date | null,
  now: Date,
): CountdownState {
  if (!publishedStartAt || !Number.isFinite(publishedStartAt.getTime()))
    return { kind: "coming_soon" };
  const seconds = Math.ceil(
    (publishedStartAt.getTime() - now.getTime()) / 1000,
  );
  return seconds > 0 ? { kind: "counting", seconds } : { kind: "started" };
}
export function Countdown({
  startAt,
  initialNow,
}: {
  startAt: string | null;
  initialNow: string;
}) {
  const [now, setNow] = useState(() => new Date(initialNow));
  useEffect(() => {
    if (!startAt) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [startAt]);
  const state = countdownState(startAt ? new Date(startAt) : null, now);
  if (state.kind === "coming_soon")
    return <p className="ulujam-soon">Yakında</p>;
  if (state.kind === "started") return <p>Etkinlik başladı.</p>;
  const days = Math.floor(state.seconds / 86400),
    hours = Math.floor((state.seconds % 86400) / 3600),
    minutes = Math.floor((state.seconds % 3600) / 60);
  return (
    <p aria-label="Etkinliğe kalan süre">
      {days} gün · {hours} saat · {minutes} dakika · {state.seconds % 60} saniye
    </p>
  );
}
