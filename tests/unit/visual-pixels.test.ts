import sharp from "sharp";
import { expect, it } from "vitest";
import {
  comparePngPixels,
  PNG_COMPARISON_LIMITS,
} from "../helpers/visual-pixels";

const pixels = Buffer.from([
  30, 40, 50, 255, 60, 70, 80, 255, 90, 100, 110, 255, 120, 130, 140, 255, 150,
  160, 170, 255, 180, 190, 200, 255,
]);

function png(data = pixels, width = 3, height = 2, compressionLevel = 6) {
  return sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel })
    .toBuffer();
}

function dimensions(image: Buffer, width: number, height: number) {
  const changed = Buffer.from(image);
  changed.writeUInt32BE(width, 16);
  changed.writeUInt32BE(height, 20);
  return changed;
}

it("compares decoded pixels rather than PNG compression bytes", async () => {
  const expected = await png(pixels, 3, 2, 0);
  const actual = await png(pixels, 3, 2, 9);
  expect(expected.equals(actual)).toBe(false);
  expect(await comparePngPixels(expected, actual)).toEqual({
    equal: true,
    dimensionsMatch: true,
    expected: { width: 3, height: 2 },
    actual: { width: 3, height: 2 },
    diffPixels: 0,
  });
});

it.each([0, 1, 2, 3])(
  "counts a one-unit change in RGBA channel %i as a changed pixel",
  async (channel) => {
    const changed = Buffer.from(pixels);
    changed[channel] -= 1;
    expect(
      await comparePngPixels(await png(), await png(changed)),
    ).toMatchObject({
      equal: false,
      dimensionsMatch: true,
      diffPixels: 1,
    });
  },
);

it("counts each changed pixel once even when several channels differ", async () => {
  const changed = Buffer.from(pixels);
  changed[0] = 0;
  changed[1] = 0;
  changed[7] = 250;
  expect(await comparePngPixels(await png(), await png(changed))).toMatchObject(
    {
      equal: false,
      diffPixels: 2,
    },
  );
});

it("normalizes an absent alpha channel to opaque RGBA", async () => {
  const expected = await png();
  const actual = await sharp(expected).removeAlpha().png().toBuffer();
  expect(await comparePngPixels(expected, actual)).toMatchObject({
    equal: true,
    diffPixels: 0,
  });
});

it("reports unequal dimensions without resizing or inventing pixel counts", async () => {
  expect(await comparePngPixels(await png(), await png(pixels, 2, 3))).toEqual({
    equal: false,
    dimensionsMatch: false,
    expected: { width: 3, height: 2 },
    actual: { width: 2, height: 3 },
    diffPixels: null,
  });
});

it.each(["expected", "actual"] as const)(
  "rejects a non-PNG %s image",
  async (side) => {
    const valid = await png();
    const invalid = Buffer.from("not a PNG screenshot");
    await expect(
      comparePngPixels(
        side === "expected" ? invalid : valid,
        side === "actual" ? invalid : valid,
      ),
    ).rejects.toThrow(new RegExp(`${side}.*PNG`, "i"));
  },
);

it("rejects truncated image data instead of returning a dimension result", async () => {
  const valid = await png();
  const truncated = dimensions(valid.subarray(0, 33), 2, 3);
  await expect(comparePngPixels(valid, truncated)).rejects.toThrow(
    /actual.*PNG/i,
  );
});

it("rejects a PNG whose header checksum is corrupt", async () => {
  const valid = await png();
  const corrupt = Buffer.from(valid);
  corrupt[29] ^= 1;
  await expect(comparePngPixels(valid, corrupt)).rejects.toThrow(
    /actual.*PNG/i,
  );
});

it("rejects an encoded image larger than the byte budget", async () => {
  const valid = await png();
  const oversized = Buffer.alloc(PNG_COMPARISON_LIMITS.maxEncodedBytes + 1);
  valid.copy(oversized);
  await expect(comparePngPixels(valid, oversized)).rejects.toThrow(
    /actual.*byte.*budget/i,
  );
});

it.each([
  [PNG_COMPARISON_LIMITS.maxDimension + 1, 1, /dimension.*budget/i],
  [4096, 4096, /pixel.*budget/i],
  [0, 1, /dimension/i],
])(
  "rejects unsafe PNG dimensions %ix%i before decoding",
  async (width, height, error) => {
    const valid = await png();
    await expect(
      comparePngPixels(
        valid,
        dimensions(valid, width as number, height as number),
      ),
    ).rejects.toThrow(error as RegExp);
  },
);

it("rejects 16-bit PNG input rather than quantizing away differences", async () => {
  const valid = await png();
  const sixteenBit = Buffer.from(valid);
  sixteenBit[24] = 16;
  await expect(comparePngPixels(valid, sixteenBit)).rejects.toThrow(
    /actual.*8-bit/i,
  );
});
