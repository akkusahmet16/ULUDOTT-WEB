import { beforeAll, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { closeDatabase } from "../../src/lib/database/client";
import {
  validateMedia,
  MAX_BYTES,
} from "../../src/modules/media/domain/media-policy";
import { removePrivate } from "../../src/modules/media/infrastructure/object-store";
import { processImage } from "../../src/modules/media/infrastructure/process-image";
import {
  uploadMedia,
  publishVariant,
  getPublicVariant,
  attachMedia,
  previewDeletion,
  deleteMedia,
} from "../../src/modules/media/application/media-service";
let local: Awaited<ReturnType<typeof createTestDatabase>>,
  original: string | undefined;
const actor = {
  adminId: randomUUID(),
  roles: ["content_editor"],
  eventScopes: [],
};
beforeAll(async () => {
  local = await createTestDatabase();
  original = process.env.DATABASE_URL;
  process.env.DATABASE_URL = local.url;
  await migrateEmptyDatabase();
  await local.sql`insert into admins(id,email,password_hash) values(${actor.adminId},'media@test.invalid','not-a-login')`;
});
afterAll(async () => {
  if (local) {
    const assets =
      await local.sql`select original_key as key from media_assets union all select object_key as key from media_variants`;
    for (const a of assets) await removePrivate(a.key);
  }
  await closeDatabase();
  if (local) await local.cleanup();
  process.env.DATABASE_URL = original;
});
const image = () =>
  sharp({
    create: { width: 80, height: 40, channels: 3, background: "#b7a0ff" },
  })
    .png()
    .toBuffer();
it("gerçek MIME, boyut, SVG ve bozuk içerik reddedilir", async () => {
  const b = await image();
  expect(validateMedia(b, "image/png")).toBe("raster");
  expect(() => validateMedia(b, "image/jpeg")).toThrow();
  expect(() =>
    validateMedia(Buffer.alloc(MAX_BYTES + 1), "image/png"),
  ).toThrow();
  expect(() => validateMedia(Buffer.from("<svg/>"), "image/svg+xml")).toThrow();
  await expect(processImage(Buffer.from("bad"), false)).rejects.toThrow();
});
it("piksel bombası decode öncesinde reddedilir", async () => {
  const b = await sharp({
    create: { width: 6000, height: 5000, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  await expect(processImage(b, false)).rejects.toThrow();
});
it("EXIF temizlenir ve yön uygulanır; 3 geçerli web biçimi çıkar", async () => {
  const b = await sharp({
    create: { width: 80, height: 40, channels: 3, background: "white" },
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();
  const v = await processImage(b, false);
  expect(v.map((x) => x.format)).toEqual(["webp", "avif", "jpeg"]);
  for (const x of v) {
    const m = await sharp(x.data).metadata();
    expect([m.width, m.height]).toEqual([40, 80]);
    expect(m.exif).toBeUndefined();
    expect(m.orientation).toBeUndefined();
  }
});
for (const [name, dimensions] of [
  ["IMG_0427.heic", [1600, 1200]],
  ["IMG_1206.heic", [1600, 900]],
] as const)
  it(`yerel HEIC yönü/metadata ${name}, yayın yapmaz`, async () => {
    const b = await readFile(`Media/${name}`);
    expect(validateMedia(b, "image/heic")).toBe("heic");
    const v = await processImage(b, true);
    expect([v[0].width, v[0].height]).toEqual(dimensions);
    expect((await sharp(v[0].data).metadata()).exif).toBeUndefined();
  }, 30_000);
it("rolsüz upload veya boş alt metin kabul edilmez", async () => {
  const f = new File([await image()], "unsafe.png", { type: "image/png" });
  await expect(
    uploadMedia({ ...actor, roles: [] }, f, "photo", "test"),
  ).rejects.toThrow("Yetki yok");
  await expect(uploadMedia(actor, f, "photo", "")).rejects.toThrow();
});
it("özel orijinal, yayın kontrolü ve silme etkisi gerçek DB/S3 üzerinde işler", async () => {
  const a = await uploadMedia(
    actor,
    new File([await image()], "../../my.png", { type: "image/png" }),
    "photo",
    "Mor test görseli",
  );
  expect(a.originalKey).not.toContain("my.png");
  const rows =
    await local.sql`select id from media_variants where asset_id=${a.id}`;
  expect(rows).toHaveLength(3);
  expect(await getPublicVariant(rows[0].id)).toBeNull();
  const url = await publishVariant(a.id, actor);
  expect(url).toMatch(/^\/media\/[a-f0-9-]+$/);
  expect(await getPublicVariant(url.split("/").at(-1)!)).not.toBeNull();
  const id = randomUUID();
  await local.sql`insert into announcements(id,title,slug,body) values(${id},'Test',${id},'Test')`;
  await attachMedia(actor, { type: "announcement", id }, a.id);
  expect((await previewDeletion(actor, a.id)).references).toHaveLength(1);
  await expect(deleteMedia(actor, a.id)).rejects.toThrow("Bağlı medya");
  await local.sql`update announcements set media_id=null where id=${id}`;
  await deleteMedia(actor, a.id);
  expect(await getPublicVariant(url.split("/").at(-1)!)).toBeNull();
}, 30_000);

it("etkinlik yöneticisi başka etkinliğe medya bağlayamaz", async () => {
  const { requirePermission } = await import(
    "../../src/modules/admin/domain/permissions"
  );
  const e = randomUUID(),
    manager = { ...actor, roles: ["event_manager"], eventScopes: [e] };
  expect(() => requirePermission(manager, "media.attach", e)).not.toThrow();
  expect(() =>
    requirePermission(manager, "media.attach", randomUUID()),
  ).toThrow("Yetki yok");
  expect(() => requirePermission(manager, "media.attach")).toThrow("Yetki yok");
});
it("orijinal S3 adresi ve yayınlanmamış türev anonim okunamaz", async () => {
  const a = await uploadMedia(
    actor,
    new File([await image()], "private.png", { type: "image/png" }),
    "photo",
    "Özel test",
  );
  const [v] =
    await local.sql`select object_key,id from media_variants where asset_id=${a.id}`;
  const { loadServerConfig } = await import("../../src/lib/config/server");
  const c = loadServerConfig().objectStorage;
  for (const key of [a.originalKey, v.object_key])
    expect((await fetch(`${c.endpoint}/${c.bucket}/${key}`)).status).toBe(403);
  expect(await getPublicVariant(a.id)).toBeNull();
  expect(await getPublicVariant(v.id)).toBeNull();
  await deleteMedia(actor, a.id);
});
it("bilinmeyen actor ile audit FK hatası medya transactionını geri alır", async () => {
  const before = (
    await local.sql`select count(*)::int as c from media_assets`
  )[0].c;
  await expect(
    uploadMedia(
      { ...actor, adminId: randomUUID() },
      new File([await image()], "rollback.png", { type: "image/png" }),
      "photo",
      "Rollback",
    ),
  ).rejects.toThrow();
  expect(
    (await local.sql`select count(*)::int as c from media_assets`)[0].c,
  ).toBe(before);
});

it("aynı DB üzerinde eşzamanlı upload ikinci decoder açmadan meşgul yanıtı verir", async () => {
  const b = await image();
  const results = await Promise.allSettled([
    uploadMedia(
      actor,
      new File([b], "a.png", { type: "image/png" }),
      "photo",
      "A",
    ),
    uploadMedia(
      actor,
      new File([b], "b.png", { type: "image/png" }),
      "photo",
      "B",
    ),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const failed = results.find((r) => r.status === "rejected");
  expect(failed?.status === "rejected" && failed.reason.message).toBe(
    "Medya işleme meşgul",
  );
});
