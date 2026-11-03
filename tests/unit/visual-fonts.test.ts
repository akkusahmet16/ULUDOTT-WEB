import { chromium, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { waitForVisualFonts } from "../helpers/visual-fonts.ts";
import {
  VISUAL_BROWSER_ARGS,
  VISUAL_DEVICE_SCALE_FACTOR,
} from "../helpers/visual-runtime.ts";

const origin = "https://127.0.0.1:39393";
const fontFile = new URL(
  "../../src/styles/fonts/ArtDeco-Regular.woff",
  import.meta.url,
);
const primaryFamilies = ["Fixture Body", "Fixture Display"];

async function withFontFixture(
  work: (page: Page) => Promise<void>,
  variables = true,
) {
  const bytes = await readFile(fontFile);
  const browser = await chromium.launch({
    channel: "chromium",
    headless: true,
    args: [...VISUAL_BROWSER_ARGS],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: VISUAL_DEVICE_SCALE_FACTOR,
      locale: "tr-TR",
      timezoneId: "Europe/Istanbul",
      colorScheme: "dark",
      reducedMotion: "no-preference",
      serviceWorkers: "block",
    });
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort("blockedbyclient");
      if (url.pathname === "/")
        return route.fulfill({
          status: 200,
          contentType: "text/html; charset=utf-8",
          body: `<!doctype html><html><head><style>
          ${variables ? ":root { --font-body: \"Fixture Body\", Arial; --font-display: 'Fixture Display', Arial; }" : ""}
          body { font-family: var(--font-body, Arial); }
          h1 { font-family: var(--font-display, Arial); }
          </style></head><body><h1>Yerel font kanıtı</h1><p>Türkçe harfler: ğüşiöç.</p></body></html>`,
        });
      if (url.pathname === "/font.woff")
        return route.fulfill({
          status: 200,
          contentType: "font/woff",
          body: bytes,
        });
      if (url.pathname === "/broken.woff")
        return route.fulfill({
          status: 200,
          contentType: "font/woff",
          body: Buffer.from("invalid WOFF fixture"),
        });
      return route.abort("blockedbyclient");
    });
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    await page.goto(origin + "/", { waitUntil: "domcontentloaded" });
    await work(page);
  } finally {
    await browser.close();
  }
}

async function registerFaces(
  page: Page,
  families: string[],
  source = "/font.woff",
) {
  await page.evaluate(
    ({ families, source }) => {
      for (const family of families)
        document.fonts.add(new FontFace(family, `url("${source}")`));
    },
    { families, source },
  );
}

async function loadRegisteredFaces(page: Page) {
  await page.evaluate(async () => {
    await Promise.all([...document.fonts].map((font) => font.load()));
    await document.fonts.ready;
  });
}

it("waits when native fonts.ready has already resolved before delayed local FontFace registration", async () => {
  await withFontFixture(async (page) => {
    expect(
      await page.evaluate(async () => {
        await document.fonts.ready;
        return document.fonts.size;
      }),
    ).toBe(0);
    const outcome = waitForVisualFonts(page, { timeoutMs: 2000 }).then(
      () => ({ state: "ready" }),
      (error: Error) => ({ state: "error", code: error.message }),
    );
    await page.waitForTimeout(75);
    await registerFaces(page, primaryFamilies);
    expect(await outcome).toEqual({ state: "ready" });
    expect(
      await page.evaluate(() =>
        [...document.fonts].map((font) => ({
          family: font.family,
          status: font.status,
        })),
      ),
    ).toEqual([
      { family: '"Fixture Body"', status: "loaded" },
      { family: '"Fixture Display"', status: "loaded" },
    ]);
  });
});

it("rejects a permanent system-font-only page at its bounded custom-font deadline", async () => {
  await withFontFixture(async (page) => {
    const started = performance.now();
    await expect(waitForVisualFonts(page, { timeoutMs: 150 })).rejects.toThrow(
      /^VISUAL_FONTS_NOT_READY$/,
    );
    expect(performance.now() - started).toBeGreaterThanOrEqual(100);
    expect(performance.now() - started).toBeLessThan(1500);
    expect(await page.evaluate(() => document.fonts.size)).toBe(0);
  });
});

it("rejects loaded fallback faces while both CSS-variable primary families are absent", async () => {
  await withFontFixture(async (page) => {
    await registerFaces(page, [
      "Fixture Body Fallback",
      "Fixture Display Fallback",
    ]);
    await loadRegisteredFaces(page);
    await expect(waitForVisualFonts(page, { timeoutMs: 150 })).rejects.toThrow(
      /^VISUAL_FONTS_NOT_READY$/,
    );
  });
});

it("requires the display family as well as the loaded body family", async () => {
  await withFontFixture(async (page) => {
    await registerFaces(page, ["Fixture Body"]);
    await loadRegisteredFaces(page);
    await expect(waitForVisualFonts(page, { timeoutMs: 150 })).rejects.toThrow(
      /^VISUAL_FONTS_NOT_READY$/,
    );
  });
});

it("rejects missing root font variables even if unrelated real local faces are loaded", async () => {
  await withFontFixture(async (page) => {
    await registerFaces(page, primaryFamilies);
    await loadRegisteredFaces(page);
    await expect(waitForVisualFonts(page, { timeoutMs: 150 })).rejects.toThrow(
      /^VISUAL_FONTS_NOT_READY$/,
    );
  }, false);
});

it("fails closed on an unused broken native FontFace instead of ignoring its decoding failure", async () => {
  await withFontFixture(async (page) => {
    await registerFaces(page, primaryFamilies);
    await registerFaces(page, ["Unused Broken Fixture"], "/broken.woff");
    await expect(waitForVisualFonts(page, { timeoutMs: 2000 })).rejects.toThrow(
      /^VISUAL_FONTS_LOAD_FAILED$/,
    );
  });
});

it("bounds a held native font request without awaiting fonts.ready forever", async () => {
  await withFontFixture(async (page) => {
    let held: import("@playwright/test").Route | undefined;
    await page.route("**/held.woff", async (route) => {
      held = route;
    });
    await registerFaces(page, primaryFamilies, "/held.woff");
    const started = performance.now();
    const outcome = waitForVisualFonts(page, { timeoutMs: 150 }).then(
      () => ({ state: "ready", code: "" }),
      (error: Error) => ({ state: "error", code: error.message }),
    );
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    try {
      const observed = await Promise.race([
        outcome,
        new Promise<{ state: string; code: string }>((resolve) => {
          watchdog = setTimeout(
            () => resolve({ state: "hung", code: "" }),
            1500,
          );
        }),
      ]);
      expect(observed).toEqual({
        state: "error",
        code: "VISUAL_FONTS_NOT_READY",
      });
      expect(performance.now() - started).toBeLessThan(1500);
    } finally {
      clearTimeout(watchdog);
      await held?.abort().catch(() => undefined);
      await outcome;
    }
  });
});
