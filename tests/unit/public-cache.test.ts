import { beforeEach, expect, it, vi } from "vitest";
import { CACHE_TAGS, PUBLIC_READ_REVALIDATE_SECONDS } from "../../src/lib/cache/tags.ts";
import type { PublicContent } from "../../src/modules/publication/domain.ts";

const state = vi.hoisted(() => ({
  databaseUrl: "postgres://fixture:secret@localhost/one",
  options: vi.fn(),
  values: new Map<string, string>(),
  read: vi.fn(async () => [{ slug: "test", lastModified: new Date("2030-01-01T00:00:00Z") }]),
  publicRead: vi.fn<() => Promise<PublicContent | null>>(),
  yearRead: vi.fn<() => Promise<Date | null>>(),
}));
vi.mock("../../src/lib/config/server.ts", () => ({
  loadServerConfig: () => ({ databaseUrl: state.databaseUrl, appUrl: "https://fixture.invalid" }),
}));
vi.mock("next/cache", () => ({
  unstable_cache: <Args extends unknown[], Result>(read: (...args: Args) => Promise<Result>, keys: string[], options: unknown) => {
    state.options(keys, options);
    return async (...args: Args): Promise<unknown> => {
      const key = JSON.stringify([keys, args]);
      if (!state.values.has(key)) state.values.set(key, JSON.stringify(await read(...args)));
      return JSON.parse(state.values.get(key)!);
    };
  },
}));
vi.mock("../../src/modules/publication/service.ts", () => ({
  listIndexablePublications: state.read, featured: vi.fn(), publicList: vi.fn(),
  publicBySlug: state.publicRead, save: vi.fn(), preview: vi.fn(), list: vi.fn(), transition: vi.fn(),
}));
vi.mock("../../src/modules/events/application/ulujam-service.ts", () => ({ publishedYearStart: state.yearRead, galleryImages: vi.fn() }));

import { cachePublicRead } from "../../src/lib/cache/public-read.ts";
import { readIndexablePublications, readPublicEvent, readPublishedYearStart } from "../../src/modules/publication/ui/public-queries.ts";

beforeEach(() => {
  state.values.clear();
  state.options.mockClear();
  state.read.mockClear();
  state.publicRead.mockReset();
  state.yearRead.mockReset();
  state.databaseUrl = "postgres://fixture:secret@localhost/one";
});

it("cache-hit içerik tarihleri ve UluJam başlangıcı Date kalır; null tarih korunur", async () => {
  const instant = new Date("2030-01-01T00:00:00Z");
  const item: PublicContent = {
    id: "fixture", title: "Fixture", slug: "fixture", excerpt: null, description: null, body: "", kind: "general",
    categoryId: null, location: null, locationType: "physical", organizer: null, startsAt: instant, endsAt: null,
    publishAt: instant, unpublishAt: null, status: "published", revision: 1, capacity: null, maxTeamSize: 6,
    mediaId: null, formId: null, eventId: null, ctaUrl: null, ctaLabel: null, seo: {}, featuredPosition: null,
    createdAt: instant, displayStatus: "published", applicationUrl: null, image: null,
  };
  state.publicRead.mockResolvedValue(item);
  state.yearRead.mockResolvedValue(instant);
  await readPublicEvent("fixture");
  const cached = await readPublicEvent("fixture");
  expect(cached?.startsAt?.getTime()).toBe(instant.getTime());
  expect(cached?.createdAt.getTime()).toBe(instant.getTime());
  expect(cached?.endsAt).toBeNull();
  expect(state.publicRead).toHaveBeenCalledTimes(1);
  await readPublishedYearStart(2027);
  expect((await readPublishedYearStart(2027))?.getTime()).toBe(instant.getTime());
  expect(state.yearRead).toHaveBeenCalledTimes(1);
  state.yearRead.mockResolvedValue(null);
  expect(await readPublishedYearStart(2028)).toBeNull();
});

it("aynı argüman DB okumasını tekrar etmez; DB değişince önbellek ayrılır, sırlar anahtara yazılmaz", async () => {
  const read = vi.fn(async (slug: string) => ({ slug }));
  const cached = cachePublicRead("test", [CACHE_TAGS.events], read);
  await cached("one");
  await cached("one");
  expect(read).toHaveBeenCalledTimes(1);
  await cached("two");
  expect(read).toHaveBeenCalledTimes(2);
  state.databaseUrl = "postgres://fixture:secret@localhost/two";
  await cached("one");
  expect(read).toHaveBeenCalledTimes(3);
  expect(JSON.stringify(state.options.mock.calls)).not.toContain("secret");
  expect(JSON.stringify(state.options.mock.calls)).not.toContain("postgres:");
  for (const [, options] of state.options.mock.calls) {
    expect(options).toEqual({ tags: [CACHE_TAGS.events], revalidate: PUBLIC_READ_REVALIDATE_SECONDS });
  }
  expect(PUBLIC_READ_REVALIDATE_SECONDS).toBeLessThanOrEqual(60);
});

it("sitemap cache-hit JSON tarihini Date'e geri çevirir ve yayın/medya etiketlerine bağlanır", async () => {
  const first = await readIndexablePublications("event");
  const cached = await readIndexablePublications("event");
  expect(first).toEqual(cached);
  expect(cached[0].lastModified.toISOString()).toBe("2030-01-01T00:00:00.000Z");
  expect(state.read).toHaveBeenCalledTimes(1);
  expect(state.options.mock.lastCall?.[1]).toMatchObject({
    tags: expect.arrayContaining([CACHE_TAGS.events, CACHE_TAGS.announcements, CACHE_TAGS.media]),
  });
});
