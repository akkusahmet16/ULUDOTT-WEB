import { beforeAll, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { closeDatabase } from "../../src/lib/database/client";
import {
  saveEvent,
  publishEvent,
  getPublicEvent,
  getFeaturedEvents,
  previewEvent,
  archiveEvent,
  changeEventStatus,
} from "../../src/modules/events/application/event-service";
import {
  saveAnnouncement,
  publishAnnouncement,
  getPublicAnnouncement,
  previewAnnouncement,
} from "../../src/modules/announcements/application/announcement-service";
let local: Awaited<ReturnType<typeof createTestDatabase>>,
  original: string | undefined;
const actor = {
  adminId: randomUUID(),
  roles: ["content_editor"],
  eventScopes: [],
};
const now = new Date("2030-01-01T12:00:00Z");
const base = {
  title: "Test buluşması",
  slug: "test-bulusmasi",
  kind: "general",
  description: "Gerçek test açıklaması",
  startsAt: "2030-01-02T12:00:00Z",
  endsAt: "2030-01-02T14:00:00Z",
  location: "Test konumu",
  featuredPosition: 0,
};
beforeAll(async () => {
  local = await createTestDatabase();
  original = process.env.DATABASE_URL;
  process.env.DATABASE_URL = local.url;
  await migrateEmptyDatabase();
  await local.sql`insert into admins(id,email,password_hash) values(${actor.adminId},'publication@test.invalid','not-a-login')`;
});
afterAll(async () => {
  await closeDatabase();
  if (local) await local.cleanup();
  process.env.DATABASE_URL = original;
});
it("Coffee Talk gerçek tarih/konum olmadan yalnız taslak ve yetkili önizlemedir", async () => {
  const e = await saveEvent(actor, {
    title: "Coffee Talk",
    slug: "coffee-talk",
    kind: "general",
  });
  expect(await getPublicEvent(e.slug, now)).toBeNull();
  expect((await previewEvent(e.id, actor)).title).toBe("Coffee Talk");
  await expect(publishEvent(e.id, actor, e.revision)).rejects.toThrow();
  await expect(
    previewEvent(e.id, { ...actor, roles: ["system_admin"] }),
  ).rejects.toThrow("Yetki yok");
});
it("planlı yayın ve kaldırma penceresi, bitti/iptal/arşiv öne çıkarılmaz", async () => {
  const e = await saveEvent(actor, {
    ...base,
    publishAt: "2030-01-01T13:00:00Z",
    unpublishAt: "2030-01-03T00:00:00Z",
  });
  const p = await publishEvent(e.id, actor, e.revision);
  expect(p.status).toBe("scheduled");
  expect(await getPublicEvent(e.slug, now)).toBeNull();
  expect(
    (await getFeaturedEvents(new Date("2030-01-01T13:00:00Z"))).some(
      (x) => x.id === e.id,
    ),
  ).toBe(true);
  expect(
    (await getPublicEvent(e.slug, new Date("2030-01-02T14:00:00Z")))
      ?.displayStatus,
  ).toBe("ended");
  expect(await getFeaturedEvents(new Date("2030-01-02T14:00:00Z"))).toEqual([]);
  expect(
    await getPublicEvent(e.slug, new Date("2030-01-03T00:00:00Z")),
  ).toBeNull();
  const c = await changeEventStatus(e.id, actor, p.revision, "cancelled");
  expect(
    (await getPublicEvent(e.slug, new Date("2030-01-01T14:00:00Z")))
      ?.displayStatus,
  ).toBe("cancelled");
  expect(await getFeaturedEvents(new Date("2030-01-01T14:00:00Z"))).toEqual([]);
  await archiveEvent(e.id, actor, c.revision);
  expect(await getPublicEvent(e.slug, now)).toBeNull();
});
it("revision yarışı tek yazarı kabul eder; slug geçmişi sadece görünür hedefe yönlenir", async () => {
  const e = await saveEvent(actor, {
    ...base,
    slug: "slug-ilk",
    featuredPosition: 1,
  });
  const p = await publishEvent(e.id, actor, e.revision);
  const r = await Promise.allSettled([
    saveEvent(
      actor,
      { ...base, slug: "slug-yeni", featuredPosition: 1 },
      e.id,
      p.revision,
    ),
    saveEvent(
      actor,
      { ...base, slug: "slug-diger", featuredPosition: 1 },
      e.id,
      p.revision,
    ),
  ]);
  expect(r.filter((x) => x.status === "fulfilled")).toHaveLength(1);
  const changed = r.find((x) => x.status === "fulfilled")!;
  if (changed.status !== "fulfilled") throw Error();
  const old = await getPublicEvent("slug-ilk", new Date());
  expect(old?.redirectSlug).toBe(changed.value.slug);
  await expect(
    saveEvent(actor, { ...base, slug: "slug-ilk", featuredPosition: 2 }),
  ).rejects.toThrow();
  await archiveEvent(e.id, actor, changed.value.revision);
  expect(await getPublicEvent("slug-ilk", new Date())).toBeNull();
});
it("nesne kapsamı ve geçersiz zaman/CTA/XSS girdileri sunucuda korunur", async () => {
  const e = await saveEvent(actor, {
    ...base,
    slug: "scope-test",
    featuredPosition: 3,
  });
  const manager = { ...actor, roles: ["event_manager"], eventScopes: [] };
  await expect(
    saveEvent(manager, { ...base, slug: "scope-test" }, e.id, e.revision),
  ).rejects.toThrow("Yetki yok");
  await expect(saveEvent(manager, base)).rejects.toThrow("Yetki yok");
  expect(
    (await previewEvent(e.id, { ...manager, eventScopes: [e.id] })).id,
  ).toBe(e.id);
  await expect(
    saveEvent(actor, {
      ...base,
      slug: "invalid-window",
      endsAt: "2029-01-01T00:00:00Z",
    }),
  ).rejects.toThrow();
  await expect(
    saveAnnouncement(actor, {
      title: "Test",
      slug: "bad-cta",
      body: "Test",
      ctaUrl: "javascript:alert(1)",
      ctaLabel: "Test",
    }),
  ).rejects.toThrow();
});
it("duyuru taslak/planlı/yayımlı, kaldırma, slug ve önizleme", async () => {
  const a = await saveAnnouncement(actor, {
    title: "Duyuru",
    slug: "duyuru-ilk",
    body: "<script>alert(1)</script>",
    publishAt: "2030-01-01T13:00:00Z",
    unpublishAt: "2030-01-01T15:00:00Z",
    seo: { title: "Paylaşım başlığı", description: "Kısa sosyal açıklama" },
  });
  expect(await getPublicAnnouncement(a.slug, now)).toBeNull();
  expect((await previewAnnouncement(a.id, actor)).body).toContain("<script>");
  const p = await publishAnnouncement(a.id, actor, a.revision);
  expect(
    (await getPublicAnnouncement(a.slug, new Date("2030-01-01T13:00:00Z")))?.seo
      .title,
  ).toBe("Paylaşım başlığı");
  expect(
    await getPublicAnnouncement(a.slug, new Date("2030-01-01T15:00:00Z")),
  ).toBeNull();
  await expect(publishAnnouncement(a.id, actor, a.revision)).rejects.toThrow(
    "Sürüm çakışması",
  );
  const updated = await saveAnnouncement(
    actor,
    {
      title: "Duyuru",
      slug: "duyuru-yeni",
      body: "Yeni içerik",
      publishAt: p.publishAt,
      unpublishAt: p.unpublishAt,
    },
    a.id,
    p.revision,
  );
  expect(
    (await getPublicAnnouncement(a.slug, new Date("2030-01-01T14:00:00Z")))
      ?.redirectSlug,
  ).toBe(updated.slug);
});
it("özel afiş yayını engeller; form bağlı olsa da görev 14 öncesi CTA yok", async () => {
  const asset = randomUUID();
  await local.sql`insert into media_assets(id,original_key,mime_type,byte_size,alt_text,status) values(${asset},${randomUUID()},'image/png',10,'Test afişi','ready')`;
  const e = await saveEvent(actor, {
    ...base,
    slug: "poster-test",
    mediaId: asset,
    featuredPosition: 4,
  });
  await expect(publishEvent(e.id, actor, e.revision)).rejects.toThrow(
    "Afiş yayımlanmalı",
  );
  await local.sql`insert into media_variants(asset_id,purpose,object_key,width,height,mime_type,published_at) values(${asset},'photo-webp',${randomUUID()},80,40,'image/webp',now())`;
  const form = randomUUID();
  await local.sql`insert into forms(id,event_id,title,slug,status) values(${form},${e.id},'Test form','test-form','draft')`;
  const updated = await saveEvent(
    actor,
    {
      ...base,
      slug: e.slug,
      mediaId: asset,
      formId: form,
      featuredPosition: 4,
    },
    e.id,
    e.revision,
  );
  await publishEvent(e.id, actor, updated.revision);
  const pub = await getPublicEvent(e.slug, new Date());
  expect(pub?.image?.altText).toBe("Test afişi");
  expect(pub?.applicationUrl).toBeNull();
  const [audit] =
    await local.sql`select count(*)::int as n from audit_logs where object_id=${e.id}`;
  expect(audit.n).toBeGreaterThan(1);
});
it("etkinlik yöneticisi atanmış etkinliğe duyuru oluşturur, genel duyuru oluşturamaz", async () => {
  const e = await saveEvent(actor, {
    ...base,
    slug: "announcement-scope",
    featuredPosition: 10,
  });
  const manager = { ...actor, roles: ["event_manager"], eventScopes: [e.id] };
  const a = await saveAnnouncement(manager, {
    title: "Kapsamlı duyuru",
    slug: "scoped-announcement",
    body: "Test",
    eventId: e.id,
  });
  expect(a.eventId).toBe(e.id);
  await expect(
    saveAnnouncement(manager, {
      title: "Genel",
      slug: "global-announcement",
      body: "Test",
    }),
  ).rejects.toThrow("Yetki yok");
});
it("form bağlantısı DB seviyesinde aynı etkinliği zorunlu tutar", async () => {
  const e = await saveEvent(actor, {
    ...base,
    slug: "form-fk",
    featuredPosition: 11,
  });
  const other = await saveEvent(actor, {
    ...base,
    slug: "form-fk-other",
    featuredPosition: 12,
  });
  const id = randomUUID();
  await local.sql`insert into forms(id,event_id,title,slug) values(${id},${other.id},'FK Test','fk-form')`;
  await expect(
    local.sql`update events set form_id=${id} where id=${e.id}`,
  ).rejects.toMatchObject({ code: "23503" });
});
it("başka taslağa ait detay CTA yayına açılmaz; hedef gizlenince bağlantı da gizlenir", async () => {
  const e = await saveEvent(actor, {
    ...base,
    slug: "cta-event",
    featuredPosition: 13,
  });
  const a = await saveAnnouncement(actor, {
    title: "CTA",
    slug: "cta-announcement",
    body: "Test",
    ctaUrl: "/etkinlikler/cta-event",
    ctaLabel: "Etkinliğe git",
  });
  await expect(publishAnnouncement(a.id, actor, a.revision)).rejects.toThrow(
    "CTA hedefi yayında değil",
  );
  const p = await publishEvent(e.id, actor, e.revision);
  await publishAnnouncement(a.id, actor, a.revision);
  expect((await getPublicAnnouncement(a.slug))?.ctaUrl).toBe(
    "/etkinlikler/cta-event",
  );
  await archiveEvent(e.id, actor, p.revision);
  expect((await getPublicAnnouncement(a.slug))?.ctaUrl).toBeNull();
});
it("genel liste son 100 taslaktan etkilenmez", async () => {
  const { getPublicEvents } =
    await import("../../src/modules/events/application/event-service");
  const e = await saveEvent(actor, {
    ...base,
    slug: "older-public",
    featuredPosition: 14,
  });
  await publishEvent(e.id, actor, e.revision);
  await local.sql`insert into events(title,slug,kind) select 'Taslak', 'draft-many-'||i, 'general' from generate_series(1,105) i`;
  expect((await getPublicEvents()).some((x) => x.id === e.id)).toBe(true);
});
it("hasarlı afiş kaydı yayından kaldırmayı engellemez", async () => {
  const asset = randomUUID();
  await local.sql`insert into media_assets(id,original_key,mime_type,byte_size,status) values(${asset},${randomUUID()},'image/png',10,'ready')`;
  const e = await saveEvent(actor, {
    ...base,
    slug: "archive-broken-cover",
    mediaId: asset,
    featuredPosition: 15,
  });
  await local.sql`update media_assets set status='rejected' where id=${asset}`;
  expect((await archiveEvent(e.id, actor, e.revision)).status).toBe("archived");
});
it("düzenleyici form seçenekleri etkinlik kapsamıyla sınırlandırılır", async () => {
  const service = await import("../../src/modules/publication/service");
  const e = await saveEvent(actor, {
    ...base,
    slug: "editor-options-event",
    featuredPosition: 16,
  });
  const other = await saveEvent(actor, {
    ...base,
    slug: "editor-options-other",
    featuredPosition: 17,
  });
  await local.sql`insert into forms(event_id,title,slug) values(${e.id},'İzinli form','option-allowed'),(${other.id},'İzinsiz form','option-denied')`;
  const result = await service.editorOptions({
    ...actor,
    roles: ["event_manager"],
    eventScopes: [e.id],
  });
  expect(result.forms.map((x) => x.title)).toEqual(["İzinli form"]);
});
it("kapsamlı duyuru etkinlikten ayrılarak genel içerik yetkisini aşamaz", async () => {
  const e = await saveEvent(actor, {
    ...base,
    slug: "scope-unlink",
    featuredPosition: 18,
  });
  const manager = { ...actor, roles: ["event_manager"], eventScopes: [e.id] };
  const a = await saveAnnouncement(manager, {
    title: "Kapsam",
    slug: "scope-unlink-ann",
    body: "Test",
    eventId: e.id,
  });
  await expect(
    saveAnnouncement(
      manager,
      { title: a.title, slug: a.slug, body: a.body, eventId: null },
      a.id,
      a.revision,
    ),
  ).rejects.toThrow("Yetki yok");
});
