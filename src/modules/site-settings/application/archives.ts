import "server-only";
import { like } from "drizzle-orm";
import { getDatabase } from "../../../lib/database/client.ts";
import { siteSettings } from "../../../db/schema/site-settings.ts";
import type { Actor } from "../../../lib/logging/audit.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import { assertSiteAsset } from "../../media/application/site-assets.ts";
import {
  archiveSchema,
  defaultArchive2026,
  type Archive,
} from "../domain/archives.ts";
import { writeSetting } from "./store.ts";
import { listPublicHistoricalResults } from "../../games/application/historical-results.ts";
async function inventory(): Promise<Archive[]> {
  const all = new Map<number, Archive>([
    [2026, { ...structuredClone(defaultArchive2026), revision: 0 }],
  ]);
  for (const row of await getDatabase()
    .select()
    .from(siteSettings)
    .where(like(siteSettings.key, "ulujam-archive:%"))) {
    const data = archiveSchema.parse(row.data);
    if (row.key !== `ulujam-archive:${data.year}`)
      throw Error("Arşiv yılı uyuşmuyor");
    all.set(data.year, { ...data, revision: row.revision });
  }
  return [...all.values()]
    .map((archive) => ({
      ...archive,
      games: [...archive.games].sort((a, b) => a.rank - b.rank),
    }))
    .sort((a, b) => a.position - b.position || b.year - a.year);
}
export async function listArchives(actor: Actor) {
  requirePermission(actor, "publication.write");
  return inventory();
}
export async function listPublishedArchives() {
  const archives = (await inventory()).filter((archive) => archive.published);
  const legacy = archives.find(
    (archive) => archive.year === 2026 && archive.revision === 0,
  );
  if (legacy) {
    const results = await listPublicHistoricalResults(2026);
    legacy.games = legacy.games.filter((game) =>
      results.some(
        (result) =>
          result.rank === game.rank && result.itchUrl === game.itchUrl,
      ),
    );
  }
  return archives;
}
export async function saveArchive(
  actor: Actor,
  input: unknown,
  expectedRevision: number,
): Promise<Archive> {
  requirePermission(actor, "publication.write");
  const data = archiveSchema.parse(input);
  for (const image of data.gallery)
    if (image.src && image.src.trim() !== "")
      await assertSiteAsset(image.src, "all", "image");
  for (const game of data.games)
    if (game.image && game.image.trim() !== "")
      await assertSiteAsset(game.image, "all", "image");
  const saved = await writeSetting(
    actor,
    `ulujam-archive:${data.year}`,
    data,
    expectedRevision,
  );
  return { ...saved.data, revision: saved.revision };
}
