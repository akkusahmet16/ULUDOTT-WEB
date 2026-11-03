import type { Page } from "@playwright/test";
import { setTimeout as delay } from "node:timers/promises";

/** Wait for the two actual local families; native fonts.ready can resolve before registration. */
export async function waitForVisualFonts(
  page: Page,
  options: { timeoutMs?: number } = {},
) {
  const timeoutMs = options.timeoutMs ?? 15_000;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0)
    throw Error("VISUAL_FONTS_DEADLINE_REQUIRED");
  const cancellation = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(Error("VISUAL_FONTS_NOT_READY")),
      timeoutMs,
    );
  });
  const poll = async () => {
    while (!cancellation.signal.aborted) {
      const state = await page.evaluate(() => {
        const primary = (value: string) => {
          const text = value.trim();
          const quoted = /^(["'])(.*?)\1(?:\s*,|\s*$)/.exec(text);
          return (quoted ? quoted[2] : text.split(",")[0]).trim().toLowerCase();
        };
        const style = getComputedStyle(document.documentElement);
        const required = ["--font-body", "--font-display"].map((name) =>
          primary(style.getPropertyValue(name)),
        );
        const faces = [...document.fonts];
        if (faces.some((face) => face.status === "error")) return "failed";
        // Start native loading without awaiting an unbounded network promise.
        // FontFace.status retains failure; each rejection is handled locally.
        for (const face of faces)
          if (face.status === "unloaded")
            void face.load().catch(() => undefined);
        const registered = required.every(
          (family) =>
            family && faces.some((face) => primary(face.family) === family),
        );
        return registered &&
          faces.length > 0 &&
          faces.every((face) => face.status === "loaded") &&
          document.fonts.status === "loaded"
          ? "ready"
          : "pending";
      });
      if (cancellation.signal.aborted) return;
      if (state === "failed") throw Error("VISUAL_FONTS_LOAD_FAILED");
      if (state === "ready") return;
      await delay(25, undefined, { signal: cancellation.signal });
    }
  };
  try {
    await Promise.race([poll(), deadline]);
  } catch (error) {
    // Browser errors can contain URLs or page data; export only neutral codes.
    if (
      error instanceof Error &&
      ["VISUAL_FONTS_NOT_READY", "VISUAL_FONTS_LOAD_FAILED"].includes(
        error.message,
      )
    )
      throw Error(error.message);
    throw Error("VISUAL_FONTS_NOT_READY");
  } finally {
    cancellation.abort();
    clearTimeout(timer);
  }
}
