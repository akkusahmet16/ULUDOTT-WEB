import sharp from "sharp";
import { expect, it, vi } from "vitest";
import type { Page } from "@playwright/test";
import { captureVisualPng } from "../helpers/visual-capture";

const viewport = { width: 3, height: 2 };
const layout = { dpr: 2, width: 3, height: 2, scale: 1, reducedMotion: false };
async function png(width = 6, height = 4) {
  return sharp({
    create: { width, height, channels: 4, background: "#192437" },
  })
    .png()
    .toBuffer();
}
function page(
  image: Buffer,
  state = layout,
  size: typeof viewport | null = viewport,
) {
  const screenshot = vi.fn().mockResolvedValue(image);
  return {
    page: {
      viewportSize: () => size,
      evaluate: async () => state,
      screenshot,
    } as unknown as Page,
    screenshot,
  };
}
it("keeps the exact native PNG bytes at the CSS viewport times DPR", async () => {
  const image = await png(),
    fixture = page(image);
  expect(await captureVisualPng(fixture.page)).toBe(image);
  expect(fixture.screenshot).toHaveBeenCalledWith(
    expect.objectContaining({
      scale: "device",
      animations: "allow",
      fullPage: false,
    }),
  );
});
it("rejects a CSS-sized PNG rather than resizing it to pass", async () => {
  await expect(captureVisualPng(page(await png(3, 2)).page)).rejects.toThrow(
    "dimensions",
  );
});
it.each([
  { ...layout, dpr: 1 },
  { ...layout, width: 4 },
  { ...layout, height: 3 },
  { ...layout, scale: 0.5 },
  { ...layout, reducedMotion: true },
])(
  "rejects a mismatched browser layout before taking a screenshot: %j",
  async (state) => {
    const fixture = page(await png(), state);
    await expect(captureVisualPng(fixture.page)).rejects.toThrow(
      "LAYOUT_CONTRACT",
    );
    expect(fixture.screenshot).not.toHaveBeenCalled();
  },
);
it("rejects an unbounded viewport", async () => {
  const fixture = page(await png(), layout, null);
  await expect(captureVisualPng(fixture.page)).rejects.toThrow(
    "CSS_VIEWPORT_REQUIRED",
  );
  expect(fixture.screenshot).not.toHaveBeenCalled();
});
