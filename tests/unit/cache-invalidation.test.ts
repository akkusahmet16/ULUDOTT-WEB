import { beforeEach, expect, it, vi } from "vitest";
import { CACHE_TAGS } from "../../src/lib/cache/tags.ts";

const mock = vi.hoisted(() => ({
  order: [] as string[],
  mutate: vi.fn<(...args: unknown[]) => Promise<{ id: string; revision: number }>>(),
  invalidate: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidateTag: (tag: string, profile: unknown) => {
  mock.order.push("invalidate");
  mock.invalidate(tag, profile);
} }));
vi.mock("../../src/lib/auth/session.ts", () => ({ SESSION_COOKIE: "session", resolveSession: async () => ({ actor: {} }) }));
vi.mock("../../src/lib/auth/csrf.ts", () => ({ readCookie: () => "fixture", verifyCsrf: () => {} }));
vi.mock("../../src/modules/admin/domain/permissions.ts", () => ({ requirePermission: () => {} }));
vi.mock("../../src/modules/publication/service.ts", () => ({ save: mock.mutate, transition: mock.mutate }));
vi.mock("../../src/modules/links/application/link-service.ts", () => ({
  saveLink: mock.mutate, saveGroup: mock.mutate, hideLink: mock.mutate,
  reorderLinks: mock.mutate, reorderGroups: mock.mutate,
}));
vi.mock("../../src/modules/media/application/media-service.ts", () => ({
  uploadMedia: mock.mutate, publishVariant: mock.mutate, deleteMedia: mock.mutate,
}));
vi.mock("../../src/modules/events/application/ulujam-service.ts", () => ({ saveGallery: mock.mutate }));

import { handler } from "../../src/modules/publication/http.ts";
import { handleLinks } from "../../src/modules/links/application/http.ts";
import { handleMediaRequest } from "../../src/modules/media/application/http.ts";
import { POST as gallery } from "../../src/app/api/admin/gallery/route.ts";

const id = "11111111-1111-4111-8111-111111111111";
const request = (data: unknown) => new Request("http://localhost/api/admin/test", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
});
beforeEach(() => {
  mock.order.length = 0;
  mock.invalidate.mockReset();
  mock.mutate.mockReset();
  mock.mutate.mockImplementation(async () => {
    mock.order.push("commit");
    return { id, revision: 2 };
  });
});

it.each(["event", "announcement"] as const)("%s kaydet/yayınla/yayından kaldır/arşiv/durum: COMMIT sonrası blocking etiket", async type => {
  for (const action of ["save", "publish", "draft", "archive", "ended", "cancelled"]) {
    mock.order.length = 0;
    const response = await handler(type)(request({ action, id, expectedRevision: 1, confirmed: true, input: {} }));
    expect(response.status).toBe(200);
    expect(mock.order).toEqual(["commit", "invalidate"]);
    expect(mock.invalidate).toHaveBeenLastCalledWith(type === "event" ? CACHE_TAGS.events : CACHE_TAGS.announcements, { expire: 0 });
  }
});

it("servis tamamlanmadan ve başarısız transaction sonrasında geçersiz kılmaz", async () => {
  let complete: (() => void) | undefined;
  mock.mutate.mockImplementationOnce(() => new Promise(resolve => {
    complete = () => { mock.order.push("commit"); resolve({ id, revision: 2 }); };
  }));
  const pending = handler("event")(request({ action: "save", input: {} }));
  await vi.waitFor(() => expect(complete).toBeDefined());
  expect(mock.invalidate).not.toHaveBeenCalled();
  complete?.();
  expect((await pending).status).toBe(201);
  expect(mock.order).toEqual(["commit", "invalidate"]);
  mock.invalidate.mockClear();
  mock.mutate.mockRejectedValueOnce(new Error("Sürüm çakışması"));
  expect((await handler("event")(request({ action: "save", input: {} }))).status).toBe(409);
  expect(mock.invalidate).not.toHaveBeenCalled();
});

it.each(["save_link", "save_group", "hide", "reorder_links", "reorder_groups"])("bağlantı %s sonrası etiket geçersizdir", async action => {
  expect((await handleLinks(request({ action, input: {}, id, expectedRevision: 1, orderedIds: [id], expectedRevisions: { [id]: 1 } }))).status).toBe(200);
  expect(mock.order).toEqual(["commit", "invalidate"]);
  expect(mock.invalidate).toHaveBeenCalledWith(CACHE_TAGS.links, { expire: 0 });
});

it.each(["publish", "delete"])("medya %s sonrası etiket geçersizdir", async action => {
  expect((await handleMediaRequest(request({ action, assetId: id, confirmed: true }))).status).toBe(200);
  expect(mock.order).toEqual(["commit", "invalidate"]);
  expect(mock.invalidate).toHaveBeenCalledWith(CACHE_TAGS.media, { expire: 0 });
});

it("medya yükleme ve galeri değişimi sonrası ilgili etiket geçersizdir", async () => {
  const form = new FormData();
  form.set("file", new File(["fixture"], "test.png", { type: "image/png" }));
  form.set("purpose", "poster");
  form.set("altText", "Sentetik fixture");
  expect((await handleMediaRequest(new Request("http://localhost/api/admin/media", { method: "POST", body: form }))).status).toBe(201);
  expect(mock.order).toEqual(["commit", "invalidate"]);
  expect(mock.invalidate).toHaveBeenLastCalledWith(CACHE_TAGS.media, { expire: 0 });
  mock.order.length = 0;
  expect((await gallery(request({ eventId: id, items: [] }))).status).toBe(200);
  expect(mock.order).toEqual(["commit", "invalidate"]);
  expect(mock.invalidate).toHaveBeenLastCalledWith(CACHE_TAGS.ulujam, { expire: 0 });
});
