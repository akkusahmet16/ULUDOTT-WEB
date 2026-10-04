import { beforeAll, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import jsQR from "jsqr";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { closeDatabase } from "../../src/lib/database/client";
import {
  saveGroup,
  saveLink,
  reorderLinks,
  reorderGroups,
  getPublishedLinks,
  getPublishedLink,
  hideLink,
  listLinks,
} from "../../src/modules/links/application/link-service";
import { createLinkQr } from "../../src/modules/links/application/link-qr";
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
  await local.sql`insert into admins(id,email,password_hash) values(${actor.adminId},'links@test.invalid','not-a-login')`;
});
afterAll(async () => {
  await closeDatabase();
  if (local) await local.cleanup();
  process.env.DATABASE_URL = original;
});
it("şema ve tehlikeli/olmayan iç URL sunucuda reddedilir", async () => {
  const g = await saveGroup(actor, { title: "Güvenlik", position: 0 });
  for (const url of [
    "javascript:alert(1)",
    "http://example.com",
    "//evil.test",
    "/admin",
    "/api/admin/events",
    "/l/loop",
    "/basvuru/kapali",
    "https://user:pass@example.com",
    "/etkinlikler/olmayan",
    "/\\evil.test",
    "https://example.com/\\evil",
    "https://example.com/\n",
  ]) {
    await expect(
      saveLink(actor, {
        groupId: g.id,
        title: "Test",
        url,
        position: 0,
        published: true,
        verified: true,
      }),
    ).rejects.toThrow();
  }
  for (const window of [
    { endsAt: "2030-01-01T12:00:00Z" },
    { startsAt: "2030-01-01T14:00:00Z", endsAt: "2030-01-01T12:00:00Z" },
    { startsAt: "not-a-date" },
  ]) {
    await expect(
      saveLink(actor, {
        groupId: g.id,
        title: "Aralık",
        url: "/",
        position: 0,
        ...window,
      }),
    ).rejects.toThrow();
  }
  await expect(
    saveLink(actor, { groupId: g.id, title: "", url: "/", position: 0 }),
  ).rejects.toThrow();
  await expect(
    saveLink(actor, {
      groupId: g.id,
      title: "Test",
      url: "/",
      position: 0,
      icon: "<svg/>",
    }),
  ).rejects.toThrow();
});
it("dış adres doğrulanmadan yayına çıkmaz; zaman penceresi ve gizleme kısa adrese uygulanır", async () => {
  const g = await saveGroup(actor, { title: "Zaman", position: 1 });
  const input = {
    groupId: g.id,
    title: "Test dış adres",
    url: "https://example.com/test",
    position: 0,
    published: true,
    startsAt: "2030-01-01T12:00:00Z",
    endsAt: "2030-01-01T14:00:00Z",
    featured: true,
  };
  await expect(saveLink(actor, input)).rejects.toThrow("Dış adresi doğrulayın");
  const l = await saveLink(actor, { ...input, verified: true });
  expect(
    await getPublishedLink(l.id, new Date("2030-01-01T11:59:59Z")),
  ).toBeNull();
  expect(
    (await getPublishedLink(l.id, new Date("2030-01-01T12:00:00Z")))?.url,
  ).toBe(input.url);
  expect(
    await getPublishedLink(l.id, new Date("2030-01-01T14:00:00Z")),
  ).toBeNull();
  await hideLink(actor, l.id, l.revision);
  expect(
    await getPublishedLink(l.id, new Date("2030-01-01T13:00:00Z")),
  ).toBeNull();
  expect(await createLinkQr(l.id)).toBeNull();
});
it("kategori ve link sırası tam snapshot ile değişir; eksik/çift/eski sıra reddedilir", async () => {
  const g = await saveGroup(actor, { title: "Sıra", position: 2 });
  const a = await saveLink(actor, {
    groupId: g.id,
    title: "İlk",
    url: "/hakkimizda",
    position: 0,
    published: true,
  });
  const b = await saveLink(actor, {
    groupId: g.id,
    title: "İkinci",
    url: "/iletisim",
    position: 1,
    published: true,
  });
  await expect(
    reorderLinks(actor, [a.id], { [a.id]: a.revision }),
  ).rejects.toThrow();
  await expect(
    reorderLinks(actor, [a.id, a.id], { [a.id]: a.revision }),
  ).rejects.toThrow();
  await reorderLinks(actor, [b.id, a.id], {
    [a.id]: a.revision,
    [b.id]: b.revision,
  });
  expect(
    (await getPublishedLinks())
      .find((x) => x.id === g.id)
      ?.links.map((x) => x.title),
  ).toEqual(["İkinci", "İlk"]);
  await expect(
    reorderLinks(actor, [a.id, b.id], {
      [a.id]: a.revision,
      [b.id]: b.revision,
    }),
  ).rejects.toThrow("Sürüm çakışması");
  const groups = (await listLinks(actor)).groups;
  await reorderGroups(
    actor,
    groups.map((x) => x.id).reverse(),
    Object.fromEntries(groups.map((x) => [x.id, x.revision])),
  );
  expect((await getPublishedLinks())[0].id).toBe(g.id);
});
it("yetkisiz mutasyon, sıra çakışması ve stale güncelleme engellenir", async () => {
  const g = await saveGroup(actor, { title: "Yetki", position: 10 });
  const l = await saveLink(actor, {
    groupId: g.id,
    title: "Yetkili",
    url: "/",
    position: 0,
  });
  await expect(
    saveLink(
      { ...actor, roles: ["system_admin"] },
      { groupId: g.id, title: "Test", url: "/", position: 1 },
    ),
  ).rejects.toThrow("Yetki yok");
  await expect(
    saveLink(actor, { groupId: g.id, title: "Çakışma", url: "/", position: 0 }),
  ).rejects.toThrow();
  const r = await Promise.allSettled([
    saveLink(actor, {
      id: l.id,
      expectedRevision: l.revision,
      groupId: g.id,
      title: "Yeni",
      url: "/",
      position: 0,
    }),
    hideLink(actor, l.id, l.revision),
  ]);
  expect(r.filter((x) => x.status === "fulfilled")).toHaveLength(1);
});
it("QR gerçek PNG'den bağımsız decode ile canonical kısa adrese çözülür", async () => {
  const g = await saveGroup(actor, { title: "QR", position: 11 });
  const l = await saveLink(actor, {
    groupId: g.id,
    title: "QR test",
    url: "/ulujam",
    position: 0,
    published: true,
  });
  const png = await createLinkQr(l.id);
  expect(png).not.toBeNull();
  const { data, info } = await sharp(png!)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  expect(decoded?.data).toBe(
    new URL(`/l/${l.id}`, process.env.APP_URL).toString(),
  );
});
it("iç detay hedefi gizlenince bağlantı ve boş kategori public listeden kalkar", async () => {
  const g = await saveGroup(actor, { title: "Dinamik hedef", position: 12 });
  const id = randomUUID();
  await local.sql`insert into events(id,title,slug,kind,status,publish_at,starts_at,location) values(${id},'Test','link-target','general','published','2020-01-01T00:00:00Z','2030-01-01','Test')`;
  const l = await saveLink(actor, {
    groupId: g.id,
    title: "Etkinlik",
    url: "/etkinlikler/link-target",
    position: 0,
    published: true,
  });
  expect(await getPublishedLink(l.id)).not.toBeNull();
  await local.sql`update events set status='archived' where id=${id}`;
  expect(await getPublishedLink(l.id)).toBeNull();
  expect((await getPublishedLinks()).some((x) => x.id === g.id)).toBe(false);
});
