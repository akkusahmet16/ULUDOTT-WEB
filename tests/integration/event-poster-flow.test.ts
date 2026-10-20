import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import sharp from "sharp";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { closeDatabase } from "../../src/lib/database/client";
import { uploadMedia, listMedia, publishVariant } from "../../src/modules/media/application/media-service";
import { save as saveContent, transition } from "../../src/modules/publication/service";

it("accepts an exact event poster and publishes an event using the home-card data", async () => {
  const local = await createTestDatabase();
  const old = process.env.DATABASE_URL;
  process.env.DATABASE_URL = local.url;
  try {
    await migrateEmptyDatabase();
    const adminId = randomUUID();
    await local.sql`insert into admins(id,email,password_hash) values(${adminId},${adminId + '@test.invalid'},'unused')`;
    const actor = { adminId, roles: ["content_editor"], eventScopes: [] };
    const bytes = await sharp({ create: { width: 1080, height: 1350, channels: 3, background: "#336644" } }).png().toBuffer();
    const asset = await uploadMedia(actor, new File([bytes], "poster.png", { type: "image/png" }), "event-poster", "Etkinlik afişi");
    const media = await listMedia(actor);
    expect(media.find((item) => item.id === asset.id)?.variants.some((variant) => variant.purpose === "event-poster-webp" && variant.width === 1080 && variant.height === 1350)).toBe(true);
    await publishVariant(asset.id, actor);
    const event = await saveContent("event", actor, {
      title: "Yeni buluşma", slug: "yeni-bulusma", excerpt: "Alt başlık",
      description: "Etkinlik açıklaması", startsAt: "2030-01-01T15:00:00+03:00",
      endsAt: "2030-01-01T17:00:00+03:00", location: "Yerel salon",
      kind: "general", mediaId: asset.id, featuredPosition: 0,
    });
    const published = await transition("event", event.id, actor, event.revision, "publish");
    expect(published.status).toBe("published");
  } finally {
    await closeDatabase();
    await local.cleanup();
    process.env.DATABASE_URL = old;
  }
});
