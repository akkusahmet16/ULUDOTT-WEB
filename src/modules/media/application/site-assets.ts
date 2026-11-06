import "server-only";
import { lstat, mkdir, readdir } from "node:fs/promises";
import { join, extname, basename, dirname } from "node:path";
import sharp from "sharp";
import type {
  SiteAsset,
  SiteAssetKind,
  SiteAssetScope,
} from "../domain/site-asset.ts";

const roots: Record<SiteAssetScope, string[]> = {
  people: [
    "/community/03-hakkimizda/people/",
    "/theme/reference/people/",
    "/uploads/people/",
  ],
  games: [
    "/community/06-oyunlar/",
    "/uploads/games/",
  ],
  ulujam: [
    "/community/02-ulujam/",
    "/uploads/ulujam/",
  ],
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MiB

function slugifyFilename(name: string): string {
  const map: Record<string, string> = {
    ç: "c",
    Ç: "c",
    ğ: "g",
    Ğ: "g",
    ı: "i",
    İ: "i",
    ö: "o",
    Ö: "o",
    ş: "s",
    Ş: "s",
    ü: "u",
    Ü: "u",
  };
  const transliterated = name.replace(
    /[çÇğĞıİöÖşŞüÜ]/g,
    (c) => map[c] ?? c,
  );
  return transliterated
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)
    .replace(/^-|-$/g, "");
}

export async function uploadSiteAsset(
  scope: SiteAssetScope,
  file: File,
  publicRoot = join(process.cwd(), "public"),
): Promise<SiteAsset> {
  if (!roots[scope]) {
    throw Error("Geçersiz medya kapsamı");
  }
  if (!file || typeof file.size !== "number" || file.size <= 0) {
    throw Error("Görsel dosyası zorunludur");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw Error("Görsel boyutu en fazla 10 MiB olabilir");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw Error("Geçersiz veya bozuk görsel dosyası");
  }

  if (
    !metadata.format ||
    !["jpeg", "png", "webp", "avif"].includes(metadata.format)
  ) {
    throw Error("Yalnızca JPEG, PNG, WebP ve AVIF formatları kabul edilir");
  }

  if (
    (metadata.width && metadata.width > 6000) ||
    (metadata.height && metadata.height > 6000) ||
    (metadata.width && metadata.height && metadata.width * metadata.height > 25_000_000)
  ) {
    throw Error("Görsel çözünürlüğü çok yüksek (en fazla 25 megapiksel)");
  }

  const rawBase = slugifyFilename(basename(file.name, extname(file.name)));
  const safeBase = rawBase || "gorsel";
  const filename = `${Date.now()}-${safeBase}.webp`;

  const targetDir = join(publicRoot, "uploads", scope);
  await mkdir(targetDir, { recursive: true, mode: 0o755 });
  const targetPath = join(targetDir, filename);

  await sharp(buffer)
    .rotate()
    .webp({ quality: 85 })
    .toFile(targetPath);

  const webPath = `/uploads/${scope}/${filename}`;
  return {
    path: webPath,
    name: filename,
    folder: `/uploads/${scope}`,
    kind: "image",
  };
}
function kindOf(path: string): SiteAssetKind | null {
  const ext = extname(path).toLowerCase();
  if ([".webp", ".png", ".jpg", ".jpeg", ".avif"].includes(ext)) return "image";
  if ([".mp4", ".webm"].includes(ext)) return "video";
  return null;
}
async function checkedFile(path: string, publicRoot: string) {
  // Check directory symlinks too: lexical prefix checks alone cannot confine a file.
  const segments = path.slice(1).split("/");
  let current = publicRoot;
  for (const segment of segments) {
    if (
      !segment ||
      segment === "." ||
      segment === ".." ||
      /[%\\?#\u0000-\u001f\u007f]/u.test(segment)
    )
      throw Error("İzin verilmeyen medya yolu");
    current = join(current, segment);
    if ((await lstat(current)).isSymbolicLink())
      throw Error("İzin verilmeyen medya yolu");
  }
  return lstat(current);
}
export async function assertSiteAsset(
  path: string,
  scope: SiteAssetScope,
  kind: SiteAssetKind,
  publicRoot = join(process.cwd(), "public"),
): Promise<void> {
  if (
    !roots[scope]?.some((root) => path.startsWith(root)) ||
    kindOf(path) !== kind
  )
    throw Error("İzin verilmeyen medya yolu");
  try {
    if (!(await checkedFile(path, publicRoot)).isFile())
      throw Error("Dosya yok");
  } catch {
    throw Error("Medya dosyası bulunamadı veya izin verilmiyor");
  }
}
export async function listSiteAssets(
  scope: SiteAssetScope,
  publicRoot = join(process.cwd(), "public"),
): Promise<SiteAsset[]> {
  const result: SiteAsset[] = [];
  async function walk(path: string) {
    for (const name of await readdir(join(publicRoot, path))) {
      const child = `${path}/${name}`,
        stat = await lstat(join(publicRoot, child));
      if (stat.isSymbolicLink()) continue;
      if (stat.isDirectory()) await walk(child);
      else if (stat.isFile()) {
        const kind = kindOf(child);
        if (kind)
          result.push({
            path: child,
            name: basename(child),
            folder: dirname(child),
            kind,
          });
      }
    }
  }
  for (const root of roots[scope] ?? []) {
    const path = root.slice(0, -1);
    try {
      if ((await checkedFile(path, publicRoot)).isDirectory()) await walk(path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return result.sort((a, b) => a.path.localeCompare(b.path, "tr"));
}
