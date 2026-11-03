import {
  chromium,
  type Browser,
  type Locator,
  type Page,
} from "@playwright/test";
import { afterAll, beforeAll, expect, it } from "vitest";
import { visualContentScenes } from "../helpers/visual-content-scenes.ts";
import {
  VISUAL_BROWSER_ARGS,
  VISUAL_DEVICE_SCALE_FACTOR,
} from "../helpers/visual-runtime.ts";

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch({
    channel: "chromium",
    headless: true,
    args: [...VISUAL_BROWSER_ARGS],
  });
});

afterAll(async () => {
  await browser?.close();
});

const contentScene = visualContentScenes("full").find(
  (scene) => scene.alias === "content-published-game-1",
)!;

async function withContentFixture(
  absoluteTop: number,
  initialScroll: number,
  work: (page: Page, target: Locator) => Promise<void>,
  reveal = false,
) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: VISUAL_DEVICE_SCALE_FACTOR,
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    colorScheme: "dark",
    reducedMotion: "no-preference",
    serviceWorkers: "block",
  });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    await page.setContent(`<!doctype html><html><head><style>
      html, body { margin: 0; }
      body { min-height: 2800px; }
      section { position: absolute; top: ${absoluteTop}px; left: 0; width: 320px; }
      article { height: 32px; }
      /* Native production reveal geometry, duration and easing. The delay
         proves that a 400ms quiet interval is not animation completion. */
      .cinematic-section {
        transform: translateY(60px);
        transition: transform 1100ms cubic-bezier(0.22, 1, 0.36, 1) 500ms;
      }
      .cinematic-section.motion-visible { transform: none; }
      </style></head><body>
      <main><section role="region" aria-label="Yayımlanmış oyunlar"
        ${reveal ? 'class="cinematic-section"' : ""}>
        <article class="published-game-card">Birinci oyun</article>
        <article class="published-game-card">İkinci oyun</article>
        <article class="published-game-card">Üçüncü oyun</article>
      </section></main></body></html>`);
    await page.evaluate((offset) => scrollTo(0, offset), initialScroll);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    const target = page
      .getByRole("region", { name: "Yayımlanmış oyunlar", exact: true })
      .locator(".published-game-card")
      .first();
    await work(page, target);
  } finally {
    await context.close();
  }
}

async function geometry(target: Locator) {
  return target.evaluate((element) => ({
    scroll: scrollY,
    top: element.getBoundingClientRect().top,
    limit: document.scrollingElement!.scrollHeight - innerHeight,
  }));
}

it.each([
  {
    name: "119px",
    absoluteTop: 1000,
    initialScroll: 881,
    initialTop: 119,
    expectedScroll: 880,
    expectedTop: 120,
  },
  {
    name: "121px",
    absoluteTop: 1000,
    initialScroll: 879,
    initialTop: 121,
    expectedScroll: 880,
    expectedTop: 120,
  },
  {
    name: "fractional 119.25px",
    absoluteTop: 1000.25,
    initialScroll: 881,
    initialTop: 119.25,
    expectedScroll: 880,
    expectedTop: 120.25,
  },
  {
    name: "fractional 120.75px",
    absoluteTop: 1000.75,
    initialScroll: 880,
    initialTop: 120.75,
    expectedScroll: 881,
    expectedTop: 119.75,
  },
  {
    name: "one pixel above the bottom scroll limit",
    absoluteTop: 2600.25,
    initialScroll: 1999,
    initialTop: 601.25,
    expectedScroll: 2000,
    expectedTop: 600.25,
  },
  {
    name: "one pixel below the top scroll limit",
    absoluteTop: 40.25,
    initialScroll: 1,
    initialTop: 39.25,
    expectedScroll: 0,
    expectedTop: 40.25,
  },
])(
  "aligns $name to its exact attainable native scroll position",
  async ({
    absoluteTop,
    initialScroll,
    initialTop,
    expectedScroll,
    expectedTop,
  }) => {
    await withContentFixture(
      absoluteTop,
      initialScroll,
      async (page, target) => {
        // Verify the browser supplied the intended initial geometry; no mocked
        // bounding boxes, scrolling APIs, animation clocks, or helper internals.
        expect(await geometry(target)).toEqual({
          scroll: initialScroll,
          top: initialTop,
          limit: 2000,
        });
        await contentScene.prepare(page);
        expect(await geometry(target)).toEqual({
          scroll: expectedScroll,
          top: expectedTop,
          limit: 2000,
        });
      },
    );
  },
  20_000,
);

it("aligns the final geometry after a delayed native 1100ms ancestor reveal", async () => {
  await withContentFixture(
    1000,
    940,
    async (page, target) => {
      expect(await geometry(target)).toEqual({
        scroll: 940,
        top: 120,
        limit: 2000,
      });
      expect(
        await page.evaluate(
          () => matchMedia("(prefers-reduced-motion: reduce)").matches,
        ),
      ).toBe(false);
      const transitions = await page.locator("section").evaluate((element) => {
        element.classList.add("motion-visible");
        return element.getAnimations().map((animation) => ({
          property: (animation as CSSTransition).transitionProperty,
          duration: animation.effect!.getComputedTiming().duration,
          delay: animation.effect!.getTiming().delay,
          state: animation.playState,
        }));
      });
      expect(transitions).toEqual([
        { property: "transform", duration: 1100, delay: 500, state: "running" },
      ]);
      await contentScene.prepare(page);

      // Production screenshot readiness also lets native finite animations finish
      // after scene.prepare. Reproduce that order so a premature alignment cannot
      // pass merely because its initial position happened to be exactly 120px.
      await expect
        .poll(
          () =>
            page.evaluate(
              () =>
                document
                  .getAnimations()
                  .filter(
                    (animation) =>
                      animation.playState === "running" &&
                      animation.effect?.getComputedTiming().iterations !==
                        Infinity &&
                      animation.timeline?.constructor.name ===
                        "DocumentTimeline",
                  ).length,
            ),
          { timeout: 3000, interval: 50 },
        )
        .toBe(0);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      expect(await geometry(target)).toEqual({
        scroll: 880,
        top: 120,
        limit: 2000,
      });
    },
    true,
  );
}, 20_000);
