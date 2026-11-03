import { test, expect, type Page, type Cookie } from "@playwright/test";
import { readFile, writeFile, appendFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { waitForVisualFonts } from "../helpers/visual-fonts.ts";
import {
  captureVisualPng,
  prepareVisualScene,
  assertVisualScenePointer,
  visibleImageIdentities,
  type VisualCaptureScene,
} from "../helpers/visual-capture.ts";
import { VISUAL_DEVICE_SCALE_FACTOR } from "../helpers/visual-runtime.ts";
import { comparePngPixels } from "../helpers/visual-pixels.ts";
import { visualMotionScenes } from "../helpers/visual-motion-scenes.ts";
import { navigateVisualPage } from "../helpers/visual-page-readiness.ts";
import { installFixedDate } from "../helpers/visual-clock-script.mjs";
import { visualStateScenes } from "../helpers/visual-state-scenes.ts";
import { visualAdditionalScenes } from "../helpers/visual-additional-scenes.ts";
import { visualContentScenes } from "../helpers/visual-content-scenes.ts";
import {
  installVisualMediaTransport,
  type VisualMediaFixture,
} from "../helpers/visual-media-fixture.ts";

type Fixture = {
  profile: "empty" | "static-approved" | "full";
  paths: Record<string, string>;
  media: VisualMediaFixture | null;
};
type Scene = VisualCaptureScene;
const fixture: Fixture = JSON.parse(
  process.env.ULUDOTT_VISUAL_FIXTURE ?? "null",
);
if (!fixture || !process.env.ULUDOTT_VISUAL_RUN)
  throw Error("GUARDED_VISUAL_RUN_REQUIRED");
const baseline = process.env.ULUDOTT_VISUAL_BASELINE!;
const epoch = Number(process.env.ULUDOTT_VISUAL_EPOCH);
const digest = (value: Buffer) =>
  createHash("sha256").update(value).digest("hex");
const region = (name: string) => async (page: Page) => {
  await page
    .getByRole("region", { name, exact: true })
    .scrollIntoViewIfNeeded();
};
const admin = (path: string): Scene => ({
  alias: path.replaceAll("/", "-").slice(1),
  path,
});
const scenes: Scene[] = [
  { alias: "home-opening", path: "/" },
  {
    alias: "home-discover",
    path: "/",
    prepare: async (p) => {
      await p.locator("#kesfet").scrollIntoViewIfNeeded();
    },
  },
  {
    alias: "home-upcoming",
    path: "/",
    prepare: region("Yaklaşan etkinlikler"),
  },
  { alias: "home-people", path: "/", prepare: region("People ve Places") },
  { alias: "home-past", path: "/", prepare: region("Geçmiş etkinlikler") },
  {
    alias: "footer",
    path: "/iletisim",
    prepare: async (p) => {
      await p.locator("footer").scrollIntoViewIfNeeded();
    },
  },
  ...["hakkimizda", "ulujam", "etkinlikler", "oyunlar", "iletisim"].map(
    (path) => ({ alias: path, path: "/" + path }),
  ),
  {
    alias: "menu-open",
    path: "/",
    prepare: async (p) => {
      await p.getByRole("button", { name: "Menü", exact: true }).click();
    },
  },
  {
    alias: "menu-community",
    path: "/",
    prepare: async (p) => {
      await p.getByRole("button", { name: "Menü", exact: true }).click();
      await p
        .getByRole("button", { name: "Topluluk alt menüsü", exact: true })
        .click();
    },
  },
  {
    alias: "menu-games-focus",
    path: "/oyunlar",
    prepare: async (p) => {
      await p.getByRole("button", { name: "Menü", exact: true }).click();
      await p
        .getByRole("button", { name: "Oyunlar alt menüsü", exact: true })
        .click();
      await p
        .getByRole("link", { name: "Dereceye giren oyunlar", exact: true })
        .focus();
    },
  },
  {
    alias: "story-ulujam",
    path: "/",
    prepare: async (p) => {
      await p
        .getByRole("button", { name: "UluJam içeriklerini aç", exact: true })
        .click();
    },
  },
  {
    alias: "story-games",
    path: "/",
    prepare: async (p) => {
      await p
        .getByRole("button", { name: "Derece oyunlarını aç", exact: true })
        .click();
    },
  },
  { alias: "receipt-no-capability", path: "/makbuz" },
  { alias: "team-invalid", path: "/takim/visual-invalid" },
  { alias: "card-invalid", path: "/kart/visual-invalid" },
  { alias: "consent-invalid", path: "/yayin-onayi/visual-invalid" },
  { alias: "public-404", path: "/etkinlikler/visual-missing" },
  { alias: "admin-login", path: "/admin" },
  {
    alias: "admin-login-focus",
    path: "/admin",
    prepare: async (p) => {
      await p.getByLabel("Özel şifre").focus();
    },
  },
];
scenes.push(...visualContentScenes(fixture.profile));
if (fixture.profile === "full") {
  scenes.push(
    {
      alias: "menu-community-hover",
      path: "/",
      pointer: "hover",
      hoverTarget: (page) =>
        page.getByRole("button", { name: "Topluluk alt menüsü", exact: true }),
      prepare: async (page) => {
        await page.getByRole("button", { name: "Menü", exact: true }).click();
        const control = page.getByRole("button", {
          name: "Topluluk alt menüsü",
          exact: true,
        });
        await control.click();
        await page.mouse.move(0, 0);
        await ready(page);
        await control.hover({ scroll: "none" });
        await expect(control).toHaveAttribute("aria-expanded", "true");
      },
    },
    ...Object.entries(fixture.paths).map(([alias, path]) => ({
      alias: "full-" + alias,
      path,
    })),
    ...[
      "/admin",
      "/admin/etkinlikler",
      "/admin/people",
      "/admin/oyunlar",
      "/admin/iletisim",
      "/admin/ulujam",
      "/admin/ulujam-arsivleri",
      "/admin/formlar",
      "/admin/basvurular",
      "/admin/takim-arayanlar",
      "/admin/takim-onaylari",
      "/admin/check-in",
      "/admin/medya",
      "/admin/linkler",
      "/admin/sistem",
    ].map(admin),
    {
      alias: "generic-form-filled",
      path: fixture.paths.form,
      prepare: async (p) => {
        await p
          .getByLabel("E-posta", { exact: false })
          .fill("visual@test.invalid");
        await p.getByLabel("Telefon", { exact: false }).fill("+905550000000");
      },
    },
  );
}

async function ready(page: Page) {
  await waitForVisualFonts(page);
  await page.evaluate(async () => {
    const visibleImages = [...document.images].filter((img) => {
      const box = img.getBoundingClientRect();
      return (
        box.width > 0 &&
        box.height > 0 &&
        box.bottom > 0 &&
        box.top < innerHeight
      );
    });
    await Promise.all(
      visibleImages.map(async (img) => {
        await img.decode();
        if (!img.naturalWidth) throw Error("VISIBLE_IMAGE_NOT_DECODED");
      }),
    );
  });
  // Let normal finite transitions settle; retain normal motion throughout readiness.
  // Scroll observers and :hover can start transitions on the following frame.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  let quietSince = performance.now();
  await expect
    .poll(
      async () => {
        const running = await page.evaluate(
          () =>
            document.getAnimations().filter((animation) => {
              const timing = animation.effect?.getComputedTiming();
              return (
                animation.playState === "running" &&
                timing?.iterations !== Infinity &&
                animation.timeline?.constructor.name === "DocumentTimeline"
              );
            }).length,
        );
        if (running !== 0) quietSince = performance.now();
        return running === 0 && performance.now() - quietSince >= 120;
      },
      { intervals: [30, 50, 100] },
    )
    .toBe(true);
  await page.evaluate(() => {
    // Pin infinite decorative animations to their existing first frame, without CSS overrides.
    for (const animation of document.getAnimations()) {
      if (animation.effect?.getComputedTiming().iterations === Infinity) {
        animation.pause();
        animation.currentTime = 0;
      }
    }
  });
  await page.evaluate(
    () =>
      new Promise<void>((done) =>
        requestAnimationFrame(() => requestAnimationFrame(() => done())),
      ),
  );
}

if (fixture.profile === "full")
  scenes.unshift(
    ...visualStateScenes(fixture.paths),
    ...(fixture.media ? visualAdditionalScenes(fixture.media) : []),
  );
if (fixture.profile === "static-approved") scenes.push(...visualMotionScenes());
const cases = [
  { width: 1280, height: 800 },
  { width: 375, height: 812 },
].flatMap((viewport) => scenes.map((scene) => ({ viewport, scene })));
if (fixture.profile === "full") {
  for (const width of [901, 1000])
    cases.push({
      viewport: { width, height: 800 },
      scene: scenes.find((scene) => scene.alias === "menu-community-hover")!,
    });
  for (const width of [320, 390, 768, 1440]) {
    for (const scene of scenes.filter((s) =>
      [
        "home-opening",
        "hakkimizda",
        "ulujam",
        "etkinlikler",
        "oyunlar",
        "iletisim",
        "admin",
        "admin-etkinlikler",
        "admin-formlar",
        "admin-people",
      ].includes(s.alias),
    ))
      cases.push({ viewport: { width, height: 812 }, scene });
  }
  for (const cut of [640, 699, 900, 1000])
    for (const width of [cut - 1, cut, cut + 1]) {
      for (const alias of ["home-opening", "menu-community"])
        cases.push({
          viewport: { width, height: 800 },
          scene: scenes.find((s) => s.alias === alias)!,
        });
    }
  for (const [cut, aliases] of [
    [
      699,
      [
        "content-archive-gallery",
        "content-archive-degree-1",
        "content-public-degree-1",
        "content-published-games-heading",
        "content-place-cafes",
        "content-place-venues",
      ],
    ],
    [1000, ["content-published-result-card"]],
  ] as const)
    for (const width of [cut - 1, cut, cut + 1])
      for (const alias of aliases)
        cases.push({
          viewport: { width, height: 800 },
          scene: scenes.find((scene) => scene.alias === alias)!,
        });
  for (const cut of [430, 560, 620, 760, 780, 930, 1100, 1150])
    for (const width of [cut - 1, cut, cut + 1]) {
      for (const alias of ["admin", "admin-etkinlikler"])
        cases.push({
          viewport: { width, height: 800 },
          scene: scenes.find((s) => s.alias === alias)!,
        });
    }
  for (const cut of [560, 1100])
    for (const width of [cut - 1, cut, cut + 1])
      cases.push({
        viewport: { width, height: 800 },
        scene: scenes.find((scene) => scene.alias === "state-events-selected")!,
      });
  for (const width of [559, 560, 561])
    for (const alias of ["state-events-poster", "state-events-dates"])
      cases.push({
        viewport: { width, height: 800 },
        scene: scenes.find((scene) => scene.alias === alias)!,
      });
  for (const height of [499, 500, 501])
    cases.push({
      viewport: { width: 1440, height },
      scene: scenes.find((s) => s.alias === "hakkimizda")!,
    });
}
let adminCookies: Cookie[] = [];
const captureFile = (
  alias: string,
  viewport: { width: number; height: number },
) => `${fixture.profile}--${alias}--${viewport.width}x${viewport.height}.png`;
test.beforeAll(async ({ browser }) => {
  const manifest = JSON.parse(
    await readFile(join(baseline, "manifest.json"), "utf8"),
  );
  if (process.env.ULUDOTT_VISUAL_RUN === "compare") {
    const approved = Object.keys(manifest.captures)
      .filter((file) => manifest.captures[file].profile === fixture.profile)
      .sort();
    expect(
      cases
        .map(({ scene, viewport }) => captureFile(scene.alias, viewport))
        .sort(),
      "complete approved scene set",
    ).toEqual(approved);
  }
  if (fixture.profile !== "full") return;
  const context = await browser.newContext({
    baseURL: "https://127.0.0.1:3443",
    ignoreHTTPSErrors: true,
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    deviceScaleFactor: VISUAL_DEVICE_SCALE_FACTOR,
  });
  try {
    const page = await context.newPage();
    await page.addInitScript(installFixedDate, epoch);
    if (fixture.media)
      await installVisualMediaTransport(page, fixture.media, manifest.source);
    // Both app bundles use the same fixed clock. Browser cookie expiry uses the
    // host clock, so keep this test session in memory without an Expires date.
    await page.route("**/api/admin/login", async (route) => {
      const response = await route.fetch();
      const headers = response.headers();
      if (headers["set-cookie"])
        headers["set-cookie"] = headers["set-cookie"].replace(
          /;\s*expires=[^;]+/gi,
          "",
        );
      await route.fulfill({ response, headers });
    });
    await navigateVisualPage(page, "/admin");
    await page
      .getByLabel("Özel şifre")
      .fill("DEMO-visual-fixture-only-password-42");
    await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
    await expect(
      page.getByRole("navigation", { name: "Yönetim modülleri" }),
    ).toBeAttached();
    adminCookies = await context.cookies();
    expect(
      adminCookies.some((cookie) => cookie.httpOnly && cookie.secure),
    ).toBe(true);
  } finally {
    await context.close();
  }
});
if (fixture.profile === "full") {
  for (const cut of [620])
    for (const width of [cut - 1, cut, cut + 1])
      for (const alias of [
        "state-people-filter",
        "state-site-game-preview",
        "admin-iletisim",
        "admin-ulujam-arsivleri",
      ])
        cases.push({
          viewport: { width, height: 800 },
          scene: scenes.find((s) => s.alias === alias)!,
        });
  for (const cut of [640])
    for (const width of [cut - 1, cut, cut + 1])
      cases.push({
        viewport: { width, height: 800 },
        scene: scenes.find((s) => s.alias === "iletisim")!,
      });
  for (const cut of [760])
    for (const width of [cut - 1, cut, cut + 1])
      cases.push({
        viewport: { width, height: 800 },
        scene: scenes.find((s) => s.alias === "state-admin-analytics-open")!,
      });
  for (const cut of [780])
    for (const width of [cut - 1, cut, cut + 1])
      cases.push({
        viewport: { width, height: 800 },
        scene: scenes.find((s) => s.alias === "admin-login")!,
      });
}
if (fixture.profile === "full") {
  for (const height of [499, 500, 501])
    for (const motion of visualMotionScenes().filter((s) =>
      s.alias.endsWith("hold70"),
    ))
      cases.push({ viewport: { width: 1440, height }, scene: motion });
  for (const cut of [699])
    for (const width of [cut - 1, cut, cut + 1])
      for (const alias of ["hakkimizda", "state-photo-dialog"])
        cases.push({
          viewport: { width, height: 800 },
          scene: scenes.find((s) => s.alias === alias)!,
        });
  for (const cut of [900, 1000])
    for (const width of [cut - 1, cut, cut + 1])
      for (const alias of ["home-upcoming", "etkinlikler"])
        cases.push({
          viewport: { width, height: 800 },
          scene: scenes.find((s) => s.alias === alias)!,
        });
  for (const cut of [430, 780, 1150])
    for (const width of [cut - 1, cut, cut + 1])
      cases.push({
        viewport: { width, height: 800 },
        scene: {
          alias: "boundary-admin-module-grid",
          path: "/admin",
          prepare: region("İçerik yönetimi"),
        },
      });
}
for (const { viewport, scene } of cases) {
  test(`${fixture.profile}/${scene.alias}/${viewport.width}x${viewport.height}`, async ({
    page,
    browser,
  }) => {
    expect(browser.version()).toBe("153.0.8010.12");
    await page.setViewportSize(viewport);
    if (fixture.media) {
      const manifest = JSON.parse(
        await readFile(join(baseline, "manifest.json"), "utf8"),
      );
      await installVisualMediaTransport(page, fixture.media, manifest.source);
    }
    await page.addInitScript(installFixedDate, epoch);
    await page.mouse.move(0, 0);
    if (
      scene.path.startsWith("/admin") &&
      !scene.alias.startsWith("admin-login")
    ) {
      await page.context().addCookies(adminCookies);
    }
    const expectedStatus = [
      "team-invalid",
      "card-invalid",
      "consent-invalid",
      "public-404",
    ].includes(scene.alias)
      ? 404
      : 200;
    await navigateVisualPage(page, scene.path, expectedStatus);
    await ready(page);
    await prepareVisualScene(page, scene);
    await ready(page);
    // Flush the compositor once with screenshot caret handling installed.
    // This image is never a baseline; the following two must still be exact.
    await captureVisualPng(page);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await ready(page);
    await assertVisualScenePointer(page, scene);
    const images = await visibleImageIdentities(page);
    const png = await captureVisualPng(page);
    await page.waitForTimeout(100);
    const repeat = await captureVisualPng(page);
    const stability = await comparePngPixels(png, repeat);
    if (!stability.equal) {
      // This matrix contains safe aliases and synthetic public/admin content;
      // capability-bearing private scenes use the separate memory-only runner.
      const diagnostic = captureFile(scene.alias, viewport);
      await writeFile(
        join(".local/phase-0c", "unstable-first-" + diagnostic),
        png,
        { mode: 0o600 },
      );
      await writeFile(
        join(".local/phase-0c", "unstable-repeat-" + diagnostic),
        repeat,
        { mode: 0o600 },
      );
    }
    expect(stability, "same-state capture must be stable").toMatchObject({
      equal: true,
      diffPixels: 0,
    });
    const videoEvidence = await page.evaluate(
      () =>
        (
          window as Window & {
            __uludottVisualVideoEvidence?: {
              width: number;
              height: number;
              rgbaSha256: string;
            };
          }
        ).__uludottVisualVideoEvidence ?? null,
    );
    const file = captureFile(scene.alias, viewport);
    const manifestPath = join(baseline, "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (process.env.ULUDOTT_VISUAL_RUN === "record-reference") {
      if (manifest.complete || manifest.captures[file])
        throw Error("BASELINE_REPLACEMENT_FORBIDDEN");
      await writeFile(join(baseline, file), png, { flag: "wx" });
      manifest.captures[file] = {
        sha256: digest(png),
        scene: scene.alias,
        profile: fixture.profile,
        viewport,
        normalMotion: true,
        images,
        videoEvidence,
      };
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    } else {
      const entry = manifest.captures[file];
      if (!entry) throw Error("MISSING_APPROVED_BASELINE: " + file);
      expect(images, "visible image selection and native dimensions").toEqual(
        entry.images,
      );
      const expected = await readFile(join(baseline, file));
      expect(digest(expected), "baseline hash: " + file).toBe(entry.sha256);
      if (entry.videoEvidence)
        expect(videoEvidence, "decoded video frame evidence").toMatchObject({
          width: entry.videoEvidence.width,
          height: entry.videoEvidence.height,
          rgbaSha256: entry.videoEvidence.rgbaSha256,
        });
      const result = await comparePngPixels(expected, png);
      if (!result.equal)
        await writeFile(join(".local/phase-0c", "candidate-" + file), png);
      expect(result, file).toMatchObject({
        equal: true,
        dimensionsMatch: true,
        diffPixels: 0,
      });
      await appendFile(process.env.ULUDOTT_VISUAL_LEDGER!, file + "\n", {
        mode: 0o600,
      });
    }
  });
}
