import {
  chromium,
  type Browser,
  type Locator,
  type Page,
} from "@playwright/test";
import { afterAll, beforeAll, expect, it } from "vitest";
import {
  prepareVisualScene,
  type VisualCaptureScene,
} from "../helpers/visual-capture.ts";
import { visualContentScenes } from "../helpers/visual-content-scenes.ts";
import {
  VISUAL_BROWSER_ARGS,
  VISUAL_DEVICE_SCALE_FACTOR,
} from "../helpers/visual-runtime.ts";
import { visualStateScenes } from "../helpers/visual-state-scenes.ts";

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

async function withPointerFixture(work: (page: Page) => Promise<void>) {
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
    // These are independent test elements with native browser behavior. No
    // application stylesheet, event handler, animation clock, or DOM API changes.
    await page.setContent(`<!doctype html><html><head><style>
      html, body { margin: 0; }
      body { min-height: 3600px; font: 16px Arial; }
      nav { position: absolute; top: 40px; left: 40px; }
      button, input { display: block; width: 280px; height: 44px; }
      input { margin-top: 20px; }
      .fixture-section { position: absolute; left: 40px; width: 320px; }
      figure { margin: 0; height: 160px; }
      .place-0 { height: 160px; }
      .published-game-card { display: block; height: 100px; }
      .hover-target, button { background-color: rgb(30, 40, 50); }
      .hover-target:hover, button:hover { background-color: rgb(240, 80, 150); }
      </style></head><body>
      <nav aria-label="Fixture controls">
        <button id="submenu-control" aria-expanded="false" aria-controls="submenu"
          onclick="this.setAttribute('aria-expanded', 'true'); document.getElementById('submenu').hidden = false">
          Topluluk alt menüsü
        </button>
        <div id="submenu" hidden>Topluluk bağlantıları</div>
        <input aria-label="E-posta" type="email">
      </nav>
      <main>
        <section class="fixture-section" style="top: 1000px"
          role="region" aria-label="UluJam 2026 arşivi">
          <section role="region" aria-label="Arşiv galerisi">
            <figure id="photo-target" class="hover-target" data-gallery-photo tabindex="0">
              <figcaption>UluJam 2026 / 01</figcaption>
            </figure>
          </section>
        </section>
        <section class="fixture-section" style="top: 1700px"
          role="region" aria-label="Mekânlar">
          <div id="place-target" class="place-0 hover-target">
            <h2>Etkinlik kafeleri</h2>
          </div>
        </section>
        <section class="fixture-section" style="top: 2400px"
          role="region" aria-label="Yayımlanmış oyunlar">
          <article id="game-target" class="published-game-card hover-target" tabindex="0">
            Birinci oyun
          </article>
          <article class="published-game-card">İkinci oyun</article>
          <article class="published-game-card">Üçüncü oyun</article>
        </section>
      </main></body></html>`);
    // Give every case the same known initial pointer state, away from controls.
    await page.mouse.move(900, 700);
    await work(page);
  } finally {
    await context.close();
  }
}

async function controlState(control: Locator) {
  return control.evaluate((element) => ({
    hovered: element.matches(":hover"),
    focused: element === document.activeElement,
    expanded: element.getAttribute("aria-expanded"),
  }));
}

it.each([
  { name: "default neutral", pointer: undefined },
  { name: "explicit neutral", pointer: "neutral" as const },
])(
  "$name clears click hover while retaining the submenu state and focus",
  async ({ pointer }) => {
    await withPointerFixture(async (page) => {
      const control = page.getByRole("button", {
        name: "Topluluk alt menüsü",
        exact: true,
      });
      const scene: VisualCaptureScene = {
        alias: "clicked-submenu",
        path: "/fixture",
        ...(pointer ? { pointer } : {}),
        prepare: async () => {
          await control.click();
          // Establish the real native click consequence before normalization.
          expect(await controlState(control)).toEqual({
            hovered: true,
            focused: true,
            expanded: "true",
          });
        },
      };
      await prepareVisualScene(page, scene);
      expect(await controlState(control)).toEqual({
        hovered: false,
        focused: true,
        expanded: "true",
      });
      expect(await page.locator("#submenu").isVisible()).toBe(true);
    });
  },
  20_000,
);

it("retains native keyboard input focus and entered text after neutral preparation", async () => {
  await withPointerFixture(async (page) => {
    const input = page.getByRole("textbox", { name: "E-posta", exact: true });
    const scene: VisualCaptureScene = {
      alias: "keyboard-input-focus",
      path: "/fixture",
      prepare: async () => {
        await page.keyboard.press("Tab");
        await page.keyboard.press("Tab");
        await page.keyboard.type("fixture@example.invalid");
      },
    };
    await prepareVisualScene(page, scene);
    expect(
      await input.evaluate((element: HTMLInputElement) => ({
        focused: element === document.activeElement,
        focusVisible: element.matches(":focus-visible"),
        hovered: element.matches(":hover"),
        value: element.value,
      })),
    ).toEqual({
      focused: true,
      focusVisible: true,
      hovered: false,
      value: "fixture@example.invalid",
    });
  });
}, 20_000);

const exportedScenes = [
  ...visualStateScenes({
    form: "/fixture/form",
    ulujamForm: "/fixture/ulujam",
  }),
  ...visualContentScenes("full"),
];

it.each([
  { alias: "state-photo-hover", selector: "#photo-target" },
  { alias: "content-archive-gallery-hover", selector: "#photo-target" },
  { alias: "content-place-cafes-hover", selector: "#place-target" },
  { alias: "content-published-game-hover", selector: "#game-target" },
])(
  "preserves the actual exported $alias scene's native hover",
  async ({ alias, selector }) => {
    await withPointerFixture(async (page) => {
      const scene = exportedScenes.find(
        (candidate) => candidate.alias === alias,
      );
      expect(
        scene,
        `The exported hover scene ${alias} must exist`,
      ).toBeDefined();
      await prepareVisualScene(page, scene!);
      // Behavioral assertions deliberately do not inspect pointer metadata. An
      // omitted hover annotation must fail when normalization moves the pointer.
      expect(
        await page.locator(selector).evaluate((element) => ({
          hovered: element.matches(":hover"),
          background: getComputedStyle(element).backgroundColor,
        })),
      ).toEqual({
        hovered: true,
        background: "rgb(240, 80, 150)",
      });
    });
  },
  20_000,
);
