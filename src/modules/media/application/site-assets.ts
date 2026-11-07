import "server-only";
import { existsSync } from "node:fs";
import { lstat, mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import { join, extname, basename, dirname } from "node:path";
import sharp from "sharp";
import type {
  SiteAsset,
  SiteAssetKind,
  SiteAssetScope,
} from "../domain/site-asset.ts";

const roots: Record<SiteAssetScope, string[]> = {
  all: [
    "/uploads/",
    "/community/",
    "/theme/reference/",
  ],
  uploads: [
    "/uploads/",
  ],
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
  sponsors: [
    "/community/01-anasayfa/sponsorlar/",
    "/uploads/sponsors/",
  ],
  places: [
    "/community/03-hakkimizda/places/",
    "/uploads/places/",
  ],
  events: [
    "/community/04-etkinlikler/",
    "/community/05-etkinlikler/",
    "/uploads/events/",
  ],
  fanzin: [
    "/uploads/fanzin/",
    "/uploads/",
  ],
  homepage: [
    "/community/01-anasayfa/",
    "/uploads/homepage/",
  ],
  general: [
    "/uploads/general/",
    "/uploads/",
    "/community/",
  ],
};

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MiB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MiB
const MAX_DOC_BYTES = 50 * 1024 * 1024; // 50 MiB

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

function kindOf(path: string): SiteAssetKind | null {
  const ext = extname(path).toLowerCase();
  if ([".webp", ".png", ".jpg", ".jpeg", ".avif", ".svg", ".gif"].includes(ext))
    return "image";
  if ([".mp4", ".webm", ".mov"].includes(ext)) return "video";
  if ([".pdf"].includes(ext)) return "document";
  return null;
}

function resolveUploadRoot(defaultPublicRoot?: string): string {
  if (defaultPublicRoot) return defaultPublicRoot;
  const cwd = process.cwd();
  const candidates = [
    join(cwd, "public"),
    join(cwd, "..", "..", "public"),
    join(cwd, "..", "public"),
    join(cwd),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return join(cwd, "public");
}

export async function uploadSiteAsset(
  scope: SiteAssetScope,
  file: File,
  publicRoot?: string,
): Promise<SiteAsset> {
  if (!roots[scope]) {
    throw Error("Geçersiz medya kapsamı");
  }
  if (!file || typeof file.size !== "number" || file.size <= 0) {
    throw Error("Dosya zorunludur");
  }

  const root = resolveUploadRoot(publicRoot);
  const uploadFolder = scope === "all" ? "general" : scope;
  const rawBase = slugifyFilename(basename(file.name, extname(file.name)));
  const safeBase = rawBase || "dosya";
  const ext = extname(file.name).toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  const targetDir = join(root, "uploads", uploadFolder);
  await mkdir(targetDir, { recursive: true, mode: 0o755 });

  // 1. PDF / Belge yüklemesi
  if (ext === ".pdf" || file.type === "application/pdf") {
    if (file.size > MAX_DOC_BYTES) {
      throw Error("PDF boyutu en fazla 50 MiB olabilir");
    }
    const filename = `${Date.now()}-${safeBase}.pdf`;
    const targetPath = join(targetDir, filename);
    await writeFile(targetPath, buffer);

    // Tüm olası standalone ve kök uploads dizinlerine senkronize et
    if (!publicRoot) {
      const cwd = process.cwd();
      const candidateUploadDirs = [
        join(cwd, "public", "uploads", uploadFolder),
        join(cwd, "uploads", uploadFolder),
        join(cwd, "..", "public", "uploads", uploadFolder),
        join(cwd, "..", "..", "public", "uploads", uploadFolder),
        join(cwd, ".next", "standalone", "public", "uploads", uploadFolder),
        join(cwd, ".next", "standalone", "uploads", uploadFolder),
      ];
      for (const dir of candidateUploadDirs) {
        if (dir !== targetDir) {
          try {
            await mkdir(dir, { recursive: true, mode: 0o755 });
            await writeFile(join(dir, filename), buffer);
          } catch {
            // ignore
          }
        }
      }
    }

    const webPath = `/uploads/${uploadFolder}/${filename}`;
    return {
      path: webPath,
      name: filename,
      folder: `/uploads/${uploadFolder}`,
      kind: "document",
      size: file.size,
      updatedAt: new Date().toISOString(),
    };
  }

  // 2. Video yüklemesi
  if (
    [".mp4", ".webm", ".mov"].includes(ext) ||
    file.type.startsWith("video/")
  ) {
    if (file.size > MAX_VIDEO_BYTES) {
      throw Error("Video boyutu en fazla 100 MiB olabilir");
    }
    const safeExt = ext || ".mp4";
    const filename = `${Date.now()}-${safeBase}${safeExt}`;
    const targetPath = join(targetDir, filename);
    await writeFile(targetPath, buffer);
    const webPath = `/uploads/${uploadFolder}/${filename}`;
    return {
      path: webPath,
      name: filename,
      folder: `/uploads/${uploadFolder}`,
      kind: "video",
      size: file.size,
      updatedAt: new Date().toISOString(),
    };
  }

  // 3. SVG vektör yüklemesi
  if (ext === ".svg" || file.type === "image/svg+xml") {
    if (file.size > 5 * 1024 * 1024) {
      throw Error("SVG boyutu en fazla 5 MiB olabilir");
    }
    const filename = `${Date.now()}-${safeBase}.svg`;
    const targetPath = join(targetDir, filename);
    await writeFile(targetPath, buffer);
    const webPath = `/uploads/${uploadFolder}/${filename}`;
    return {
      path: webPath,
      name: filename,
      folder: `/uploads/${uploadFolder}`,
      kind: "image",
      size: file.size,
      updatedAt: new Date().toISOString(),
    };
  }

  // 4. Standart Görsel yüklemesi (Sharp ile WebP'ye optimize edilir)
  if (file.size > MAX_IMAGE_BYTES) {
    throw Error("Görsel boyutu en fazla 15 MiB olabilir");
  }

  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw Error("Geçersiz veya bozuk görsel dosyası");
  }

  if (
    !metadata.format ||
    !["jpeg", "png", "webp", "avif", "gif"].includes(metadata.format)
  ) {
    throw Error("Yalnızca JPEG, PNG, WebP, AVIF ve GIF formatları kabul edilir");
  }

  if (
    (metadata.width && metadata.width > 6000) ||
    (metadata.height && metadata.height > 6000) ||
    (metadata.width &&
      metadata.height &&
      metadata.width * metadata.height > 25_000_000)
  ) {
    throw Error("Görsel çözünürlüğü çok yüksek (en fazla 25 megapiksel)");
  }

  const filename = `${Date.now()}-${safeBase}.webp`;
  const targetPath = join(targetDir, filename);

  const optimizedBuffer = await sharp(buffer)
    .rotate()
    .webp({ quality: 85 })
    .toBuffer();

  await writeFile(targetPath, optimizedBuffer);

  if (!publicRoot) {
    const cwd = process.cwd();
    const candidateUploadDirs = [
      join(cwd, "public", "uploads", uploadFolder),
      join(cwd, "uploads", uploadFolder),
      join(cwd, "..", "public", "uploads", uploadFolder),
      join(cwd, "..", "..", "public", "uploads", uploadFolder),
      join(cwd, ".next", "standalone", "public", "uploads", uploadFolder),
      join(cwd, ".next", "standalone", "uploads", uploadFolder),
    ];
    for (const dir of candidateUploadDirs) {
      if (dir !== targetDir) {
        try {
          await mkdir(dir, { recursive: true, mode: 0o755 });
          await writeFile(join(dir, filename), optimizedBuffer);
        } catch {
          // ignore
        }
      }
    }
  }

  const webPath = `/uploads/${uploadFolder}/${filename}`;
  return {
    path: webPath,
    name: filename,
    folder: `/uploads/${uploadFolder}`,
    kind: "image",
    size: optimizedBuffer.length,
    updatedAt: new Date().toISOString(),
  };
}

export async function deleteSiteAsset(
  path: string,
  publicRoot = join(process.cwd(), "public"),
): Promise<{ success: boolean; path: string }> {
  if (!path || typeof path !== "string" || !path.startsWith("/")) {
    throw Error("Geçersiz dosya yolu");
  }

  const allowedPrefixes = ["/uploads/", "/community/", "/theme/reference/"];
  const isAllowed = allowedPrefixes.some((prefix) => path.startsWith(prefix));
  if (!isAllowed) {
    throw Error("Sadece uploads ve community klasörlerindeki medya dosyaları silinebilir");
  }

  const segments = path.slice(1).split("/");
  for (const segment of segments) {
    if (
      !segment ||
      segment === "." ||
      segment === ".." ||
      /[%\\?#\u0000-\u001f\u007f]/u.test(segment)
    ) {
      throw Error("İzin verilmeyen dosya yolu");
    }
  }

  const fullPath = join(publicRoot, path);

  let stat;
  try {
    stat = await lstat(fullPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw Error("Dosya bulunamadı");
    }
    throw error;
  }

  if (stat.isSymbolicLink()) {
    throw Error("Sembolik bağlantılar silinemez");
  }

  if (stat.isDirectory()) {
    throw Error("Klasörler doğrudan silinemez, yalnızca dosyalar silinebilir");
  }

  const kind = kindOf(path);
  if (!kind) {
    throw Error("Yalnızca medya ve belge dosyaları silinebilir");
  }

  await unlink(fullPath);

  return { success: true, path };
}

async function checkedFile(path: string, publicRoot: string) {
  const cleanPath = path.trim().replace(/^\/+/, "/").split("?")[0].split("#")[0];
  const segments = cleanPath.slice(1).split("/").filter(Boolean);
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
  const cleanPath = path.trim().replace(/^\/+/, "/");
  if (
    cleanPath.startsWith("http://") ||
    cleanPath.startsWith("https://") ||
    cleanPath.startsWith("data:")
  ) {
    return;
  }
  const allowedRoots = roots[scope] ?? [];
  if (
    !allowedRoots.some((root) => cleanPath.startsWith(root)) ||
    kindOf(cleanPath) !== kind
  )
    throw Error("İzin verilmeyen medya yolu");
  try {
    const root = resolveUploadRoot(publicRoot);
    let stat;
    try {
      stat = await checkedFile(cleanPath, root);
    } catch {
      stat = await checkedFile(cleanPath, publicRoot);
    }
    if (!stat.isFile())
      throw Error("Dosya yok");
  } catch {
    throw Error("Medya dosyası bulunamadı veya izin verilmiyor");
  }
}

export async function listSiteAssets(
  scope: SiteAssetScope = "all",
  publicRoot = join(process.cwd(), "public"),
): Promise<SiteAsset[]> {
  const result: SiteAsset[] = [];
  const seenPaths = new Set<string>();

  async function walk(path: string) {
    let entries: string[] = [];
    try {
      entries = await readdir(join(publicRoot, path));
    } catch {
      return;
    }
    for (const name of entries) {
      const child = `${path}/${name}`;
      try {
        const stat = await lstat(join(publicRoot, child));
        if (stat.isSymbolicLink()) continue;
        if (stat.isDirectory()) {
          await walk(child);
        } else if (stat.isFile()) {
          const kind = kindOf(child);
          if (kind && !seenPaths.has(child)) {
            seenPaths.add(child);
            result.push({
              path: child,
              name: basename(child),
              folder: dirname(child),
              kind,
              size: stat.size,
              updatedAt: stat.mtime.toISOString(),
            });
          }
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  for (const root of roots[scope] ?? roots.all) {
    const path = root.slice(0, -1);
    try {
      if ((await checkedFile(path, publicRoot)).isDirectory()) {
        await walk(path);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }

  return result.sort((a, b) => a.path.localeCompare(b.path, "tr"));
}
