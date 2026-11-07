import { afterAll, beforeAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { closeDatabase } from "../../src/lib/database/client";
import { getHomeEvents } from "../../src/modules/events/application/home-events";
import { Children, isValidElement, type ReactNode } from "react";
import EventsPage from "../../src/app/(public)/etkinlikler/page";
import { CoffeeTalkCard } from "../../src/components/layout/coffee-talk-card";

let local: Awaited<ReturnType<typeof createTestDatabase>>;
let original: string | undefined;
const now = new Date("2030-01-02T12:00:00Z");
beforeAll(async () => {
  local = await createTestDatabase();
  original = process.env.DATABASE_URL;
  process.env.DATABASE_URL = local.url;
  await migrateEmptyDatabase();
});
afterAll(async () => {
  await closeDatabase();
  await local.cleanup();
  process.env.DATABASE_URL = original;
});

it("bitiş anında geçmişe geçer; devam eden/tarihsiz bitişli kayıtlar üstte, yeni geçmiş önce görünür", async () => {
  for (const [slug, start, end, status, publish, unpublish] of [
    [
      "future-late",
      "2030-01-04T12:00Z",
      "2030-01-04T14:00Z",
      "published",
      "2020-01-01",
      null,
    ],
    [
      "future-no-end",
      "2030-01-03T12:00Z",
      null,
      "published",
      "2020-01-01",
      null,
    ],
    [
      "ongoing",
      "2030-01-02T11:00Z",
      "2030-01-02T13:00Z",
      "published",
      "2020-01-01",
      null,
    ],
    [
      "just-ended",
      "2030-01-02T10:00Z",
      "2030-01-02T12:00Z",
      "published",
      "2020-01-01",
      null,
    ],
    [
      "older",
      "2030-01-01T10:00Z",
      "2030-01-01T12:00Z",
      "ended",
      "2020-01-01",
      null,
    ],
    ["draft", "2030-01-01T10:00Z", "2030-01-01T12:00Z", "draft", null, null],
    [
      "cancelled",
      "2030-01-01T10:00Z",
      "2030-01-01T12:00Z",
      "cancelled",
      "2020-01-01",
      null,
    ],
    [
      "archived",
      "2030-01-01T10:00Z",
      "2030-01-01T12:00Z",
      "archived",
      "2020-01-01",
      null,
    ],
    [
      "scheduled",
      "2030-01-04T10:00Z",
      "2030-01-04T12:00Z",
      "scheduled",
      "2030-01-03",
      null,
    ],
    [
      "removed",
      "2030-01-01T10:00Z",
      "2030-01-01T12:00Z",
      "ended",
      "2020-01-01",
      "2030-01-02T11:00Z",
    ],
  ]) {
    await local.sql`insert into events(id,title,slug,kind,status,starts_at,ends_at,publish_at,unpublish_at) values(${randomUUID()},${slug},${slug},'general',${status},${start},${end},${publish},${unpublish})`;
  }
  const sections = await getHomeEvents(now);
  expect(sections.upcoming.map((event) => event.slug)).toEqual([
    "ongoing",
    "future-no-end",
    "future-late",
  ]);
  expect(sections.past.map((event) => event.slug)).toEqual([
    "just-ended",
    "older",
  ]);
  const earlier = await getHomeEvents(new Date("2030-01-02T11:59:59Z"));
  expect(earlier.upcoming.some((event) => event.slug === "just-ended")).toBe(
    true,
  );
  expect(earlier.past.some((event) => event.slug === "just-ended")).toBe(false);
});

it("bitis saati olmayan etkinlik baslangic saati geldiginde otomatik gecmise duser ve konumsuz yayinlanabilir", async () => {
  const pastNoEndId = randomUUID();
  await local.sql`insert into events(id,title,slug,kind,status,starts_at,ends_at,publish_at,location) values(${pastNoEndId},'Bitis Saatsiz','bitis-saatsiz','general','published','2030-01-02T11:00Z',null,'2020-01-01',null)`;
  const sections = await getHomeEvents(now);
  expect(sections.past.some((e) => e.slug === "bitis-saatsiz")).toBe(true);
  expect(sections.upcoming.some((e) => e.slug === "bitis-saatsiz")).toBe(false);

  const beforeStart = await getHomeEvents(new Date("2030-01-02T10:30:00Z"));
  expect(beforeStart.upcoming.some((e) => e.slug === "bitis-saatsiz")).toBe(true);
  expect(beforeStart.past.some((e) => e.slug === "bitis-saatsiz")).toBe(false);
});

it("eski Coffee Talk kartı yalnız geçmişte korunur; paneldeki kayıt taslak olsa bile kopyası geri eklenmez", async () => {
  function legacyCards(node: ReactNode): number {
    return Children.toArray(node).reduce<number>((count, child) => {
      if (!isValidElement<{ children?: ReactNode }>(child)) return count;
      return (
        count +
        (child.type === CoffeeTalkCard ? 1 : 0) +
        legacyCards(child.props.children)
      );
    }, 0);
  }
  expect(
    (await getHomeEvents(new Date("2026-10-07T17:29:59Z")))
      .showLegacyCoffeeTalk,
  ).toBe(false);
  expect((await getHomeEvents(now)).showLegacyCoffeeTalk).toBe(true);
  expect(legacyCards(await EventsPage())).toBe(1);
  const id = randomUUID();
  await local.sql`insert into events(id,title,slug,kind,status) values(${id},'Coffee Talk','coffee-talk','general','draft')`;
  expect((await getHomeEvents(now)).showLegacyCoffeeTalk).toBe(false);
  expect(legacyCards(await EventsPage())).toBe(0);
  await local.sql`update events set slug='renamed-coffee-talk' where id=${id}`;
  await local.sql`insert into content_redirects(content_type,content_id,old_slug) values('event',${id},'coffee-talk')`;
  expect((await getHomeEvents(now)).showLegacyCoffeeTalk).toBe(false);
  expect(legacyCards(await EventsPage())).toBe(0);
  await local.sql`update events set status='archived' where id=${id}`;
  expect(legacyCards(await EventsPage())).toBe(0);
});

it("Etkinlikler sayfası yaklaşan ve geçmiş başlıklarını ayrı gösterir, Coffee Talk yalnız geçmiştedir", async () => {
  await local.sql`insert into events(id,title,slug,kind,status,starts_at,ends_at,publish_at) values(${randomUUID()},'Yeni buluşma','section-future','general','published','2099-01-01T10:00Z','2099-01-01T12:00Z','2020-01-01')`;
  await local.sql`insert into events(id,title,slug,kind,status,starts_at,ends_at,publish_at) values(${randomUUID()},'Eski buluşma','section-past','general','published','2020-01-01T10:00Z','2020-01-01T12:00Z','2020-01-01')`;
  type Node = React.ReactElement<{
    children?: ReactNode;
    "aria-label"?: string;
    event?: { slug: string };
  }>;
  function elements(node: ReactNode): Node[] {
    return Children.toArray(node).flatMap((child) =>
      isValidElement(child)
        ? [child as Node, ...elements((child as Node).props.children)]
        : [],
    );
  }
  await local.sql`delete from content_redirects where old_slug='coffee-talk'`;
  await local.sql`delete from events where slug='renamed-coffee-talk'`;
  const nodes = elements(await EventsPage());
  const upcoming = nodes.find(
    (node) =>
      node.type === "section" &&
      node.props["aria-label"] === "Yaklaşan etkinlikler",
  );
  const past = nodes.find(
    (node) =>
      node.type === "section" &&
      node.props["aria-label"] === "Geçmiş etkinlikler",
  );
  expect(upcoming).toBeDefined();
  expect(past).toBeDefined();
  expect(
    elements(upcoming).some(
      (node) => node.props.event?.slug === "section-future",
    ),
  ).toBe(true);
  expect(
    elements(upcoming).some(
      (node) => node.props.event?.slug === "section-past",
    ),
  ).toBe(false);
  expect(
    elements(past).some((node) => node.props.event?.slug === "section-past"),
  ).toBe(true);
  expect(
    elements(past).some((node) => node.props.event?.slug === "section-future"),
  ).toBe(false);
  expect(
    elements(past).filter((node) => node.type === CoffeeTalkCard),
  ).toHaveLength(1);
});
