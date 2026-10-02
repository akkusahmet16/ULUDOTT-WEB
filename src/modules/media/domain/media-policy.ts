import "server-only";
export const MAX_BYTES = 8 * 1024 * 1024;
export const MAX_PIXELS = 25_000_000;
export type MediaPurpose = "photo" | "poster" | "game" | "social";
export function validateMedia(
  data: Uint8Array,
  mime: string,
): "heic" | "raster" {
  if (!data.length || data.length > MAX_BYTES)
    throw new Error("Dosya boyutu sınırı");
  const b = Buffer.from(data);
  let actual = "";
  if (b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    actual = "image/png";
  else if (b[0] === 255 && b[1] === 216 && b[2] === 255) actual = "image/jpeg";
  else if (
    b.toString("ascii", 0, 4) === "RIFF" &&
    b.toString("ascii", 8, 12) === "WEBP"
  )
    actual = "image/webp";
  else if (b.toString("ascii", 4, 8) === "ftyp") {
    const size = b.readUInt32BE(0);
    if (size < 16 || size > b.length || size > 4096)
      throw new Error("Geçersiz görsel");
    const brands = [b.toString("ascii", 8, 12)];
    for (let i = 16; i < size; i += 4)
      brands.push(b.toString("ascii", i, i + 4));
    if (brands.includes("avif")) actual = "image/avif";
    else if (
      brands.some((x) => ["heic", "heix", "hevc", "hevx", "mif1"].includes(x))
    )
      actual = "image/heic";
  }
  if (
    !actual ||
    (actual !== mime && !(actual === "image/heic" && mime === "image/heif"))
  )
    throw new Error("MIME ve gerçek içerik eşleşmiyor");
  return actual === "image/heic" ? "heic" : "raster";
}
