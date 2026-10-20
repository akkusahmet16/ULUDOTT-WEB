import { expect, it } from "vitest";
import sharp from "sharp";
import { requireEventPosterDimensions } from "../../src/modules/media/application/event-poster-policy";

it("accepts only 1080 by 1350 event artwork", async () => {
  const valid = await sharp({ create: { width: 1080, height: 1350, channels: 3, background: "#335577" } }).png().toBuffer();
  const wrong = await sharp({ create: { width: 1080, height: 1349, channels: 3, background: "#335577" } }).png().toBuffer();
  await expect(requireEventPosterDimensions(valid, "image/png")).resolves.toBeUndefined();
  await expect(requireEventPosterDimensions(wrong, "image/png")).rejects.toThrow("1080×1350");
  await expect(requireEventPosterDimensions(valid, "image/heic")).rejects.toThrow();
});
