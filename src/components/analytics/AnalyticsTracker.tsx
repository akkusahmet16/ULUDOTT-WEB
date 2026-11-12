"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function TrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialReferrerRef = useRef<string>("");

  useEffect(() => {
    if (typeof window !== "undefined" && !initialReferrerRef.current) {
      initialReferrerRef.current = document.referrer || "";
    }
  }, []);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }

    const payload = JSON.stringify({
      type: "pageview",
      path: pathname,
      referer: initialReferrerRef.current || undefined,
      screenWidth: typeof window !== "undefined" ? window.innerWidth : undefined,
    });

    // Record page view after a short delay so navigation completes smoothly
    const timer = setTimeout(() => {
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
        // Telemetry errors are non-fatal
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerInner />
    </Suspense>
  );
}
