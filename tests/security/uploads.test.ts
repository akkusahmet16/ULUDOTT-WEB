import { expect, it } from "vitest";
import {
  validateMedia,
  MAX_BYTES,
} from "../../src/modules/media/domain/media-policy";
import { readJson } from "../../src/lib/http/read-json";
it("SVG/executable payloads disguised as raster, MIME mismatch and oversized files are rejected", () => {
  for (const mime of ["image/png", "image/jpeg", "image/heic"])
    expect(() =>
      validateMedia(Buffer.from('<svg onload="alert(1)">'), mime),
    ).toThrow();
  expect(() =>
    validateMedia(Buffer.from([255, 216, 255, 0]), "image/png"),
  ).toThrow();
  expect(() =>
    validateMedia(new Uint8Array(MAX_BYTES + 1), "image/png"),
  ).toThrow();
});
it("Chunked JSON without length cannot bypass actual byte limit", async () => {
  await expect(
    readJson(
      new Request("https://example.test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "x".repeat(2048) }),
      }),
      1024,
    ),
  ).rejects.toThrow("büyük");
});
