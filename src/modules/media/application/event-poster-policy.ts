import "server-only";
import sharp from "sharp";

export async function requireEventPosterDimensions(bytes: Buffer, mime: string) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(mime))
    throw Error("Etkinlik afişi PNG, JPEG veya WebP olmalı");
  const meta = await sharp(bytes, { limitInputPixels: 25_000_000, animated: false }).metadata();
  const rotated = [5, 6, 7, 8].includes(meta.orientation ?? 1);
  const width = rotated ? meta.height : meta.width;
  const height = rotated ? meta.width : meta.height;
  if (meta.pages && meta.pages > 1 || width !== 1080 || height !== 1350)
    throw Error("Etkinlik afişi tam 1080×1350 piksel olmalı");
}
