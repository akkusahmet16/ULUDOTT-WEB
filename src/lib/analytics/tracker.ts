"use client";

export function trackSiteEvent(
  eventType: string,
  eventName: string,
  metadata?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    type: "event",
    eventType,
    eventName,
    path: window.location.pathname,
    metadata,
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/track", blob);
    } else {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Analytics telemetry failures should never interrupt UI
  }
}
