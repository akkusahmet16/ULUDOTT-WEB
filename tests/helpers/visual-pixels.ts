import sharp from "sharp";

// At most 96 MB of decoded RGBA data for a pair, excluding decoder overhead.
export const PNG_COMPARISON_LIMITS = Object.freeze({
  maxEncodedBytes: 32 * 1024 * 1024,
  maxDimension: 32_768,
  maxPixels: 12_000_000,
} as const);

type Dimensions = { width: number; height: number };
export type PngPixelComparison = {
  equal: boolean;
  dimensionsMatch: boolean;
  expected: Dimensions;
  actual: Dimensions;
  diffPixels: number | null;
};

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function inspectPng(image: Buffer, side: string): Dimensions {
  if (image.length > PNG_COMPARISON_LIMITS.maxEncodedBytes)
    throw new Error(
      `${side} PNG exceeds encoded byte budget (${image.length})`,
    );
  if (
    image.length < 33 ||
    !image.subarray(0, 8).equals(pngSignature) ||
    image.readUInt32BE(8) !== 13 ||
    image.toString("ascii", 12, 16) !== "IHDR"
  )
    throw new Error(`${side} is not a PNG with a complete IHDR header`);

  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  if (!width || !height)
    throw new Error(`${side} PNG dimensions must be positive`);
  if (
    width > PNG_COMPARISON_LIMITS.maxDimension ||
    height > PNG_COMPARISON_LIMITS.maxDimension
  )
    throw new Error(
      `${side} PNG exceeds dimension budget (${width}x${height})`,
    );
  if (width * height > PNG_COMPARISON_LIMITS.maxPixels)
    throw new Error(`${side} PNG exceeds pixel budget (${width}x${height})`);
  if (image[24] !== 8)
    throw new Error(`${side} PNG must use 8-bit screenshot samples`);
  return { width, height };
}

/** Reject a capture at a different density; never resize it into agreement. */
export function assertPngDimensions(image: Buffer, expected: Dimensions) {
  if (
    ![expected.width, expected.height].every(
      (value) => Number.isSafeInteger(value) && value > 0,
    )
  )
    throw Error("Expected capture dimensions must be positive integers");
  const actual = inspectPng(image, "capture");
  if (actual.width !== expected.width || actual.height !== expected.height)
    throw Error(
      `Capture dimensions differ: ${actual.width}x${actual.height}, expected ${expected.width}x${expected.height}`,
    );
  return actual;
}

async function decodePng(image: Buffer, side: string, dimensions: Dimensions) {
  try {
    const { data, info } = await sharp(image, {
      failOn: "warning",
      limitInputPixels: PNG_COMPARISON_LIMITS.maxPixels,
      sequentialRead: true,
    })
      .toColourspace("srgb")
      .ensureAlpha()
      .raw({ depth: "uchar" })
      .toBuffer({ resolveWithObject: true });
    if (
      info.width !== dimensions.width ||
      info.height !== dimensions.height ||
      info.channels !== 4 ||
      data.length !== dimensions.width * dimensions.height * 4
    )
      throw new Error("Decoded PNG dimensions or channels differ from IHDR");
    return data;
  } catch (cause) {
    throw new Error(`${side} PNG decode failed`, { cause });
  }
}

/** Compare 8-bit PNG screenshots without resizing or pixel tolerance. */
export async function comparePngPixels(
  expected: Buffer,
  actual: Buffer,
): Promise<PngPixelComparison> {
  const expectedDimensions = inspectPng(expected, "expected");
  const actualDimensions = inspectPng(actual, "actual");
  // Decode sequentially, and validate both even when their dimensions differ.
  const expectedPixels = await decodePng(
    expected,
    "expected",
    expectedDimensions,
  );
  const actualPixels = await decodePng(actual, "actual", actualDimensions);
  const result = {
    expected: expectedDimensions,
    actual: actualDimensions,
  };
  if (
    expectedDimensions.width !== actualDimensions.width ||
    expectedDimensions.height !== actualDimensions.height
  )
    return {
      ...result,
      equal: false,
      dimensionsMatch: false,
      diffPixels: null,
    };

  let diffPixels = 0;
  for (let offset = 0; offset < expectedPixels.length; offset += 4)
    if (
      expectedPixels[offset] !== actualPixels[offset] ||
      expectedPixels[offset + 1] !== actualPixels[offset + 1] ||
      expectedPixels[offset + 2] !== actualPixels[offset + 2] ||
      expectedPixels[offset + 3] !== actualPixels[offset + 3]
    )
      diffPixels++;
  return {
    ...result,
    equal: diffPixels === 0,
    dimensionsMatch: true,
    diffPixels,
  };
}
