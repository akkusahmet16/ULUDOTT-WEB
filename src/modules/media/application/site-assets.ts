import "server-only";
import { lstat, readdir } from "node:fs/promises";
import { join, extname, basename, dirname } from "node:path";
import type {
  SiteAsset,
  SiteAssetKind,
  SiteAssetScope,
} from "../domain/site-asset.ts";
const roots: Record<SiteAssetScope, string[]> = {
  people: ["/community/03-hakkimizda/people/", "/theme/reference/people/"],
  games: ["/community/06-oyunlar/"],
  ulujam: ["/community/02-ulujam/"],
};
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
