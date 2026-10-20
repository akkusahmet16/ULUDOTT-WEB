import { afterAll, beforeAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { closeDatabase } from "../../src/lib/database/client";
import {
  galleryImages,
  saveGallery,
} from "../../src/modules/events/application/ulujam-service";
import {
  gameOptions,
  saveGameDraft,
} from "../../src/modules/games/application/game-service";

let local: Awaited<ReturnType<typeof createTestDatabase>>;
let original: string | undefined;
const eventId = randomUUID();
const actor = {
  adminId: randomUUID(),
  roles: ["content_editor"],
  eventScopes: [],
};
const purposes = [
  "webp",
  "photo-webp",
  "poster-webp",
  "event-poster-webp",
  "game-webp",
  "social-webp",
];

beforeAll(async () => {
  local = await createTestDatabase();
  original = process.env.DATABASE_URL;
  process.env.DATABASE_URL = local.url;
  await migrateEmptyDatabase();
  await local.sql`insert into admins(id,email,password_hash) values(${actor.adminId},'media-consumer@test.invalid','not-a-login')`;
  await local.sql`insert into events(id,title,slug,kind,status) values(${eventId},'Media compatibility',${eventId},'ulujam','draft')`;
  await local.sql`insert into event_years(event_id,year) values(${eventId},2035)`;
});

afterAll(async () => {
  await closeDatabase();
  if (local) await local.cleanup();
  process.env.DATABASE_URL = original;
});

async function media(purpose: string, mimeType = "image/webp") {
  const assetId = randomUUID();
  const variantId = randomUUID();
  await local.sql`insert into media_assets(id,original_key,mime_type,byte_size,alt_text,status) values(${assetId},${"test/" + assetId},'image/png',1,'Test image','ready')`;
  await local.sql`insert into media_variants(id,asset_id,purpose,object_key,mime_type,width,height,published_at) values(${variantId},${assetId},${purpose},${"test/" + variantId},${mimeType},80,40,'2020-01-01')`;
  return { assetId, variantId };
}

it.each(purposes)(
  "gallery saves legacy and uploaded %s WebP variants",
  async (purpose) => {
    const { assetId } = await media(purpose);
    await saveGallery(actor, {
      eventId,
      mediaId: assetId,
      position: purposes.indexOf(purpose),
      verified: false,
    });
    const rows =
      await local.sql`select media_id from event_gallery where event_id=${eventId} and media_id=${assetId}`;
    expect(rows).toHaveLength(1);
  },
);

it.each(purposes)(
  "gallery reads verified published %s WebP variants",
  async (purpose) => {
    const { assetId, variantId } = await media(purpose);
    const position = 10 + purposes.indexOf(purpose);
    await local.sql`insert into event_gallery(event_id,media_id,position,verified_at) values(${eventId},${assetId},${position},now())`;
    expect(await galleryImages(2035)).toContainEqual({
      id: variantId,
      src: "/media/" + variantId,
      alt: "Test image",
    });
  },
);

it.each(purposes)(
  "game drafts accept published %s WebP covers",
  async (purpose) => {
    const { assetId } = await media(purpose);
    const game = await saveGameDraft(actor, eventId, {
      title: "Test game",
      slug: "test-" + randomUUID(),
      description: null,
      teamId: null,
      mediaId: assetId,
      itchUrl: "https://example.itch.io/test",
      credits: [],
    });
    const [row] =
      await local.sql`select media_id,published_at from games where id=${game.id}`;
    expect(row).toEqual({ media_id: assetId, published_at: null });
  },
);

it.each(purposes)(
  "game options include published %s WebP covers",
  async (purpose) => {
    const { assetId } = await media(purpose);
    expect((await gameOptions(actor, eventId)).covers).toContainEqual({
      id: assetId,
      label: "Test image",
    });
  },
);

it("gallery keeps verification, publication, readiness and MIME gates", async () => {
  for (const [index, state] of [
    "unverified",
    "unpublished",
    "private",
    "wrong-mime",
  ].entries()) {
    const { assetId, variantId } = await media(
      "photo-webp",
      state === "wrong-mime" ? "image/avif" : "image/webp",
    );
    await local.sql`insert into event_gallery(event_id,media_id,position,verified_at) values(${eventId},${assetId},${30 + index},${state === "unverified" ? null : new Date("2020-01-01")})`;
    if (state === "unpublished")
      await local.sql`update media_variants set published_at=null where id=${variantId}`;
    if (state === "private")
      await local.sql`update media_assets set status='private' where id=${assetId}`;
    expect((await galleryImages(2035)).map((image) => image.id)).not.toContain(
      variantId,
    );
  }
});

it("game covers reject unpublished variants and non-WebP MIME", async () => {
  for (const state of ["unpublished", "wrong-mime"]) {
    const { assetId, variantId } = await media(
      "webp",
      state === "wrong-mime" ? "image/avif" : "image/webp",
    );
    if (state === "unpublished")
      await local.sql`update media_variants set published_at=null where id=${variantId}`;
    expect(
      (await gameOptions(actor, eventId)).covers.map((cover) => cover.id),
    ).not.toContain(assetId);
    await expect(
      saveGameDraft(actor, eventId, {
        title: "Invalid cover",
        slug: "invalid-" + randomUUID(),
        description: null,
        teamId: null,
        mediaId: assetId,
        itchUrl: "https://example.itch.io/test",
        credits: [],
      }),
    ).rejects.toThrow("Yayımlanmış kapak");
  }
});

it("multiple published WebP variants produce one stable gallery image and cover option per asset", async () => {
  const { assetId, variantId } = await media("photo-webp");
  const first = "10000000-0000-4000-8000-000000000001";
  const second = "20000000-0000-4000-8000-000000000001";
  await local.sql`update media_variants set id=${second} where id=${variantId}`;
  await local.sql`insert into media_variants(id,asset_id,purpose,object_key,mime_type,width,height,published_at) values(${first},${assetId},'webp',${"test/" + first},'image/webp',80,40,'2020-01-01')`;
  await local.sql`insert into event_gallery(event_id,media_id,position,verified_at) values(${eventId},${assetId},40,now())`;
  const images = await galleryImages(2035);
  expect(images.filter((image) => [first, second].includes(image.id))).toEqual([
    { id: first, src: "/media/" + first, alt: "Test image" },
  ]);
  expect(
    (await gameOptions(actor, eventId)).covers.filter(
      (cover) => cover.id === assetId,
    ),
  ).toEqual([{ id: assetId, label: "Test image" }]);
});
