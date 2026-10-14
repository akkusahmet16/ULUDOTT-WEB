import "server-only";
import { z } from "zod";
import { cachePublicRead } from "../../../lib/cache/public-read.ts";
import { CACHE_TAGS } from "../../../lib/cache/tags.ts";
import { getFeaturedEvents, getPublicEvent, getPublicEvents } from "../../events/application/event-service.ts";
import { getPublicAnnouncement, getPublicAnnouncements } from "../../announcements/application/announcement-service.ts";
import { publishedYearStart, galleryImages } from "../../events/application/ulujam-service.ts";
import { getPublishedLinks } from "../../links/application/link-service.ts";
import { listPublicHistoricalResults } from "../../games/application/historical-results.ts";
import { listIndexablePublications } from "../service.ts";
import type { ContentRecord, ContentType } from "../domain.ts";

const nullableDate = z.coerce.date().nullable();
const contentDates = z.object({
  createdAt: z.coerce.date(),
  startsAt: nullableDate,
  endsAt: nullableDate,
  publishAt: nullableDate,
  unpublishAt: nullableDate,
});

// unstable_cache JSON serileştirir: cache-hit ve ilk okuma aynı Date sözleşmesini taşır.
function restoreContentDates<T extends ContentRecord>(item: T): T {
  return { ...item, ...contentDates.parse(item) };
}

// CTA ve medya görünürlüğü diğer yayın türüne de bağlı olabilir.
const publicationTags = [CACHE_TAGS.events, CACHE_TAGS.announcements, CACHE_TAGS.media];
const featured = cachePublicRead("featured-events", publicationTags, () => getFeaturedEvents());
const events = cachePublicRead("events", publicationTags, () => getPublicEvents());
const event = cachePublicRead("event", publicationTags, (slug: string) => getPublicEvent(slug));
const announcements = cachePublicRead("announcements", publicationTags, () => getPublicAnnouncements());
const announcement = cachePublicRead("announcement", publicationTags, (slug: string) => getPublicAnnouncement(slug));
const indexable = cachePublicRead("indexable-publications", publicationTags, (type: ContentType) => listIndexablePublications(type));
const links = cachePublicRead("published-links", [CACHE_TAGS.links, ...publicationTags], () => getPublishedLinks());
const yearStart = cachePublicRead("ulujam-year-start", [CACHE_TAGS.events, CACHE_TAGS.ulujam], (year: number) => publishedYearStart(year));

export async function readFeaturedEvents() {
  return (await featured()).map(restoreContentDates);
}
export async function readPublicEvents() {
  return (await events()).map(restoreContentDates);
}
export async function readPublicEvent(slug: string) {
  const item = await event(slug);
  return item ? restoreContentDates(item) : null;
}
export async function readPublicAnnouncements() {
  return (await announcements()).map(restoreContentDates);
}
export async function readPublicAnnouncement(slug: string) {
  const item = await announcement(slug);
  return item ? restoreContentDates(item) : null;
}
export async function readIndexablePublications(type: ContentType) {
  return (await indexable(type)).map(item => ({ ...item, lastModified: z.coerce.date().parse(item.lastModified) }));
}
export async function readPublishedLinks() {
  return (await links()).map(group => ({
    ...group,
    links: group.links.map(link => ({
      ...link,
      startsAt: nullableDate.parse(link.startsAt),
      endsAt: nullableDate.parse(link.endsAt),
      verifiedAt: nullableDate.parse(link.verifiedAt),
    })),
  }));
}
export async function readPublishedYearStart(year: number) {
  return nullableDate.parse(await yearStart(year));
}
export const readGalleryImages = cachePublicRead("gallery-images", [CACHE_TAGS.events, CACHE_TAGS.ulujam, CACHE_TAGS.media], (year: number) => galleryImages(year));
export const readHistoricalResults = cachePublicRead("historical-results", [CACHE_TAGS.historicalResults, CACHE_TAGS.media], (year: number) => listPublicHistoricalResults(year));
