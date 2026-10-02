import { seedUlujamComingSoon } from "../../src/db/seeds/ulujam-coming-soon";
import { beforeEach, afterEach, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { getDatabase, closeDatabase } from "../../src/lib/database/client";
import { seed2026Results } from "../../src/db/seeds/2026-results";
import { historical2026 } from "../../src/modules/games/domain/historical-result";
import {
  publishedYearStart,
  galleryImages,
  saveGallery,
} from "../../src/modules/events/application/ulujam-service";
import { deleteMedia } from "../../src/modules/media/application/media-service";
let local: Awaited<ReturnType<typeof createTestDatabase>>,
  old: string | undefined;
const actor = {
  adminId: randomUUID(),
  roles: ["content_editor"],
  eventScopes: [],
};
beforeEach(async () => {
  local = await createTestDatabase();
  old = process.env.DATABASE_URL;
  process.env.DATABASE_URL = local.url;
  await migrateEmptyDatabase();
  await seed2026Results(getDatabase());
  await local.sql`insert into admins(id,email,password_hash) values(${actor.adminId},'archive@test.invalid','not-login')`;
});
afterEach(async () => {
  await closeDatabase();
  await local.cleanup();
  process.env.DATABASE_URL = old;
});
it("2027 başlangıcı yalnız yayımlı tarih için gelir, geri çekilince kapanır", async () => {
  const id = randomUUID();
  await local.sql`insert into events(id,title,slug,kind,status,publish_at,starts_at) values(${id},'Test','test-2027','ulujam','published','2020-01-01','2030-01-01')`;
  await local.sql`insert into event_years(event_id,year) values(${id},2027)`;
  expect((await publishedYearStart(2027))?.toISOString()).toBe(
    "2030-01-01T00:00:00.000Z",
  );
  await local.sql`update events set status='draft' where id=${id}`;
  expect(await publishedYearStart(2027)).toBeNull();
  await local.sql`update events set status='published',starts_at=null where id=${id}`;
  expect(await publishedYearStart(2027)).toBeNull();
});
it("galeri yalnız editörce ilişkilendirilmiş, onaylı ve yayımlı türevi gösterir", async () => {
  const asset = randomUUID(),
    variant = randomUUID();
  await local.sql`insert into media_assets(id,original_key,mime_type,byte_size,alt_text,status) values(${asset},${"fake/" + asset},'image/jpeg',100,'Arşiv testi','ready')`;
  await local.sql`insert into media_variants(id,asset_id,object_key,mime_type,width,height,purpose,published_at) values(${variant},${asset},${"fake/" + variant},'image/webp',10,10,'webp','2020-01-01')`;
  const input = {
    eventId: historical2026.eventId,
    mediaId: asset,
    position: 0,
    verified: false,
  };
  await saveGallery(actor, input);
  expect(await galleryImages(2026)).toEqual([]);
  await saveGallery(actor, { ...input, verified: true, expectedRevision: 1 });
  expect(await galleryImages(2026)).toEqual([
    { id: variant, src: "/media/" + variant, alt: "Arşiv testi" },
  ]);
  await expect(deleteMedia(actor, asset)).rejects.toThrow();
  await local.sql`update media_variants set published_at=null where id=${variant}`;
  expect(await galleryImages(2026)).toEqual([]);
});
it("galeri yetki/kapsam ve doğrulanmamış medya reddini korur", async () => {
  await expect(
    saveGallery(
      { ...actor, roles: ["system_admin"] },
      {
        eventId: historical2026.eventId,
        mediaId: randomUUID(),
        position: 0,
        verified: true,
      },
    ),
  ).rejects.toThrow("Yetki yok");
  await expect(
    saveGallery(
      { ...actor, roles: ["event_manager"], eventScopes: [] },
      {
        eventId: historical2026.eventId,
        mediaId: randomUUID(),
        position: 0,
        verified: true,
      },
    ),
  ).rejects.toThrow("Yetki yok");
  await expect(
    saveGallery(actor, {
      eventId: historical2026.eventId,
      mediaId: randomUUID(),
      position: 0,
      verified: true,
    }),
  ).rejects.toThrow("Medya");
});

it("2027 düzenlenebilir yıl taslağı tarih ve konum uydurmadan kurulabilir", async () => {
  await seedUlujamComingSoon(getDatabase());
  await seedUlujamComingSoon(getDatabase());
  const [r] =
    await local.sql`select e.status,e.starts_at,e.location,e.publish_at from events e join event_years y on y.event_id=e.id where y.year=2027`;
  expect(r).toEqual({
    status: "draft",
    starts_at: null,
    location: null,
    publish_at: null,
  });
  expect(await publishedYearStart(2027)).toBeNull();
});
