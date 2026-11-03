import type { Page } from "@playwright/test";
import type { Sql } from "postgres";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { open } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { historical2026 } from "../../src/modules/games/domain/historical-result.ts";
const VISUAL_FIXED_TIME = "2026-10-22T09:00:00.000Z";
import type { SourceManifest } from "./visual-reference.ts";

export type VisualMediaVariant = {
  id: string;
  assetId: string;
  purpose: "webp" | "event-poster-webp";
  publicPath: string;
  mime: "image/webp";
  width: number;
  height: number;
  sha256: string;
  published: boolean;
};

export type VisualMediaFixture = {
  version: 1;
  assets: { published: string; unpublished: string };
  variants: VisualMediaVariant[];
  bindings: { eventId: string; gameId: string; siteGameId: string };
};

const approvedPoster =
  "/community/04-etkinlikler/etkinlik-coffe-talk/etkinlik-coffe-talk-afis.webp";
const candidateRoot = fileURLToPath(new URL("../../", import.meta.url));
const fixtureId = (value: number) =>
  `0c000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
const ids = {
  published: fixtureId(500),
  webp: fixtureId(501),
  poster: fixtureId(502),
  unpublished: fixtureId(510),
  privatePoster: fixtureId(511),
  event: fixtureId(10),
  siteGame: fixtureId(51),
};
const hash = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");

async function approvedImage(root: string, publicPath: string) {
  // No arbitrary path, remote URL, generated image, resizing or re-encoding.
  if (publicPath !== approvedPoster)
    throw Error("APPROVED_VISUAL_MEDIA_PATH_REQUIRED");
  const handle = await open(
    join(root, "public", publicPath.slice(1)),
    constants.O_RDONLY | constants.O_NOFOLLOW,
  );
  try {
    if (!(await handle.stat()).isFile())
      throw Error("APPROVED_VISUAL_MEDIA_FILE_REQUIRED");
    const bytes = await handle.readFile();
    const metadata = await sharp(bytes, {
      limitInputPixels: 25_000_000,
      animated: false,
    }).metadata();
    if (
      metadata.format !== "webp" ||
      metadata.width !== 1080 ||
      metadata.height !== 1350 ||
      (metadata.pages ?? 1) !== 1 ||
      (metadata.orientation ?? 1) !== 1
    )
      throw Error("APPROVED_VISUAL_POSTER_METADATA_MISMATCH");
    return {
      bytes,
      width: metadata.width,
      height: metadata.height,
      sha256: hash(bytes),
    };
  } finally {
    await handle.close();
  }
}

/**
 * Extend only an owned full visual fixture. Object keys are inert fixture
 * metadata: no S3 operation occurs. Browser transport supplies the approved
 * source bytes; this fixture makes no claim about media HTTP authorization.
 */
export async function seedVisualMediaFixture(
  sql: Sql,
): Promise<VisualMediaFixture> {
  if (
    !sql.options.host.length ||
    sql.options.host.some((host) => !["127.0.0.1", "localhost"].includes(host))
  )
    throw Error("VISUAL_MEDIA_OWNED_LOCAL_DATABASE_REQUIRED");
  const [identity] = await sql`select current_database() as name`;
  if (!/^uludott_test_[0-9a-f]{32}$/.test(String(identity.name)))
    throw Error("VISUAL_MEDIA_OWNED_LOCAL_DATABASE_REQUIRED");
  const image = await approvedImage(candidateRoot, approvedPoster);
  const variants: VisualMediaVariant[] = [
    { id: ids.webp, assetId: ids.published, purpose: "webp", published: true },
    {
      id: ids.poster,
      assetId: ids.published,
      purpose: "event-poster-webp",
      published: true,
    },
    {
      id: ids.privatePoster,
      assetId: ids.unpublished,
      purpose: "event-poster-webp",
      published: false,
    },
  ].map((variant) => ({
    ...variant,
    purpose: variant.purpose as VisualMediaVariant["purpose"],
    publicPath: approvedPoster,
    mime: "image/webp",
    width: image.width,
    height: image.height,
    sha256: image.sha256,
  }));
  await sql.begin(async (tx) => {
    const [state] = await tx`select
      (select count(*) from media_assets)+(select count(*) from media_variants) as media_count,
      (select count(*) from events where id=${ids.event} and slug='demo-visual-future') as events,
      (select count(*) from games where id=${historical2026.results[0].id} and slug='demo-visual-game') as games,
      (select count(*) from site_game_entries where id=${ids.siteGame}) as site_games`;
    if (
      Number(state.media_count) !== 0 ||
      Number(state.events) !== 1 ||
      Number(state.games) !== 1 ||
      Number(state.site_games) !== 1
    )
      throw Error("VISUAL_MEDIA_UNEXTENDED_FULL_FIXTURE_REQUIRED");
    for (const [assetId, alt] of [
      [ids.published, "DEMO yayımlanmış onaylı afiş"],
      [ids.unpublished, "DEMO özel onaylı afiş"],
    ])
      await tx`insert into media_assets(id,original_key,mime_type,byte_size,alt_text,status,created_at)
        values(${assetId},${`visual-fixture-only/original/${assetId}`},'image/webp',${image.bytes.length},${alt},'ready',${VISUAL_FIXED_TIME})`;
    for (const variant of variants)
      await tx`insert into media_variants(id,asset_id,purpose,object_key,width,height,mime_type,published_at)
        values(${variant.id},${variant.assetId},${variant.purpose},${`visual-fixture-only/variant/${variant.id}.webp`},${variant.width},${variant.height},${variant.mime},${variant.published ? "2020-01-01T00:00:00Z" : null})`;
    await tx`update events set media_id=${ids.published} where id=${ids.event}`;
    await tx`update games set media_id=${ids.published} where id=${historical2026.results[0].id}`;
    await tx`update site_game_entries set data=jsonb_set(data,'{image}',to_jsonb(${`/media/${ids.webp}`}::text)) where id=${ids.siteGame}`;
  });
  return {
    version: 1,
    assets: { published: ids.published, unpublished: ids.unpublished },
    variants,
    bindings: {
      eventId: ids.event,
      gameId: historical2026.results[0].id,
      siteGameId: ids.siteGame,
    },
  };
}

/**
 * Fulfill exact known fixture image GETs, using the original v0.1 source bytes
 * verified against both descriptor and source manifest. Other requests continue
 * through the real application. This deliberately replaces only object-byte
 * transport, so fixed test clocks cannot invalidate S3 signatures.
 */
export async function installVisualMediaTransport(
  page: Page,
  descriptor: VisualMediaFixture,
  sourceManifest: SourceManifest,
): Promise<void> {
  if (descriptor.version !== 1 || !descriptor.variants.length)
    throw Error("VISUAL_MEDIA_DESCRIPTOR_REQUIRED");
  const payloads = new Map<
    string,
    { variant: VisualMediaVariant; bytes: Buffer }
  >();
  for (const variant of descriptor.variants) {
    if (
      !/^0c000000-0000-4000-8000-\d{12}$/.test(variant.id) ||
      payloads.has(variant.id) ||
      variant.mime !== "image/webp" ||
      !["webp", "event-poster-webp"].includes(variant.purpose)
    )
      throw Error("VISUAL_MEDIA_DESCRIPTOR_MISMATCH");
    const source = sourceManifest.files.find(
      (file) => file.path === `public${variant.publicPath}`,
    );
    if (!source) throw Error("VISUAL_MEDIA_SOURCE_RECORD_REQUIRED");
    const image = await approvedImage(
      sourceManifest.sourceRoot,
      variant.publicPath,
    );
    if (
      image.sha256 !== variant.sha256 ||
      image.sha256 !== source.sha256 ||
      image.bytes.length !== source.bytes ||
      image.width !== variant.width ||
      image.height !== variant.height
    )
      throw Error("VISUAL_MEDIA_SOURCE_BYTES_MISMATCH");
    payloads.set(variant.id, { variant, bytes: image.bytes });
  }
  function target(url: URL) {
    if (
      !["http:", "https:"].includes(url.protocol) ||
      !["127.0.0.1", "localhost"].includes(url.hostname)
    )
      return;
    if (url.pathname.startsWith("/media/") && !url.search) {
      const item = payloads.get(url.pathname.slice("/media/".length));
      return item?.variant.published ? { ...item, private: false } : undefined;
    }
    if (url.pathname === "/api/admin/media") {
      const id = url.searchParams.get("preview");
      if (id && url.search === `?preview=${id}`) {
        const item = payloads.get(id);
        return item ? { ...item, private: true } : undefined;
      }
    }
  }
  await page.route(
    (url) => Boolean(target(url)),
    async (route) => {
      const item = target(new URL(route.request().url()));
      if (!item || route.request().method() !== "GET") {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        body: item.bytes,
        headers: {
          "Content-Type": item.variant.mime,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": item.private
            ? "no-store"
            : "public, max-age=60, must-revalidate",
          ...(item.private
            ? { "Referrer-Policy": "no-referrer" }
            : { "Content-Disposition": "inline" }),
        },
      });
    },
  );
}
