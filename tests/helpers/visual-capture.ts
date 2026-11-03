import { expect, type Locator, type Page } from "@playwright/test";
import { assertPngDimensions } from "./visual-pixels.ts";
import { VISUAL_DEVICE_SCALE_FACTOR } from "./visual-runtime.ts";

export type VisualCaptureScene = {
  alias: string;
  path: string;
  prepare?: (page: Page) => Promise<void>;
} & (
  | { pointer?: "neutral"; hoverTarget?: never }
  | { pointer: "hover"; hoverTarget: (page: Page) => Locator }
);

/** Ordinary states have a neutral pointer; hover is an explicit scene state. */
export async function prepareVisualScene(
  page: Page,
  scene: VisualCaptureScene,
) {
  await scene.prepare?.(page);
  if (scene.pointer === "hover") await assertVisualScenePointer(page, scene);
  else await page.mouse.move(0, 0);
}

/** Recheck after native animations settle, so a moving target cannot lose hover. */
export async function assertVisualScenePointer(
  page: Page,
  scene: VisualCaptureScene,
) {
  if (scene.pointer !== "hover") return;
  const target = scene.hoverTarget(page);
  await expect(target).toHaveCount(1);
  await expect
    .poll(() => target.evaluate((element) => element.matches(":hover")))
    .toBe(true);
}

/** Capture native device pixels, with no image resizing or CSS override. */
export async function captureVisualPng(page: Page) {
  const viewport = page.viewportSize();
  if (!viewport) throw Error("VISUAL_CSS_VIEWPORT_REQUIRED");
  const layout = await page.evaluate(() => ({
    dpr: devicePixelRatio,
    width: innerWidth,
    height: innerHeight,
    scale: visualViewport?.scale,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  }));
  if (
    layout.dpr !== VISUAL_DEVICE_SCALE_FACTOR ||
    layout.width !== viewport.width ||
    layout.height !== viewport.height ||
    layout.scale !== 1 ||
    layout.reducedMotion
  )
    throw Error("VISUAL_NATIVE_LAYOUT_CONTRACT_FAILED");
  const png = await page.screenshot({
    animations: "allow",
    caret: "hide",
    fullPage: false,
    scale: "device",
  });
  assertPngDimensions(png, {
    width: viewport.width * VISUAL_DEVICE_SCALE_FACTOR,
    height: viewport.height * VISUAL_DEVICE_SCALE_FACTOR,
  });
  return png;
}

/** Only the public/synthetic matrix persists image identities; private URLs stay in memory. */
export async function visibleImageIdentities(page: Page) {
  return page.evaluate(async () =>
    Promise.all(
      [...document.images]
        .filter((image) => {
          const box = image.getBoundingClientRect();
          return (
            box.width > 0 &&
            box.height > 0 &&
            box.bottom > 0 &&
            box.top < innerHeight &&
            box.right > 0 &&
            box.left < innerWidth
          );
        })
        .map(async (image) => {
          const url = new URL(image.currentSrc);
          // Blob/data previews have per-context identities. Their rendered bytes are
          // covered by the exact PNG gate; never persist a capability-bearing URL.
          const source = ["blob:", "data:"].includes(url.protocol)
            ? "in-memory-preview"
            : [
                ...new Uint8Array(
                  await crypto.subtle.digest(
                    "SHA-256",
                    new TextEncoder().encode(image.currentSrc),
                  ),
                ),
              ]
                .map((byte) => byte.toString(16).padStart(2, "0"))
                .join("");
          return {
            source,
            width: image.naturalWidth,
            height: image.naturalHeight,
          };
        }),
    ),
  );
}
