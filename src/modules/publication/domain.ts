import { z } from "zod";
export const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const optionalText = z.string().trim().max(500).nullable().default(null);
const instant = z
  .union([z.iso.datetime({ offset: true }), z.date()])
  .transform((x) => new Date(x))
  .nullable()
  .default(null);
export const seoSchema = z
  .strictObject({
    title: z.string().trim().max(160).optional(),
    description: z.string().trim().max(300).optional(),
  })
  .default({});
export const common = {
  title: z.string().trim().min(1).max(180),
  slug: slugSchema,
  excerpt: optionalText,
  mediaId: z.uuid().nullable().default(null),
  publishAt: instant,
  unpublishAt: instant,
  seo: seoSchema,
};
export function windowCheck(v: {
  publishAt: Date | null;
  unpublishAt: Date | null;
}) {
  return !v.unpublishAt || (!!v.publishAt && v.unpublishAt > v.publishAt);
}
export const eventInput = z
  .strictObject({
    ...common,
    kind: z.enum(["general", "ulujam"]),
    categoryId: z.uuid().nullable().default(null),
    description: z.string().trim().max(20000).nullable().default(null),
    location: optionalText,
    locationType: z.enum(["physical", "online"]).default("physical"),
    organizer: optionalText,
    startsAt: instant,
    endsAt: instant,
    capacity: z.int().positive().nullable().default(null),
    maxTeamSize: z.int().min(1).max(100).default(6),
    formId: z.uuid().nullable().default(null),
    featuredPosition: z.int().min(0).max(1000).nullable().default(null),
  })
  .refine(windowCheck, "Geçersiz yayın penceresi")
  .refine(
    (v) => !v.endsAt || (!!v.startsAt && v.endsAt > v.startsAt),
    "Geçersiz etkinlik tarihleri",
  )
  .refine(
    (v) => v.locationType !== "online" || !v.location || safeUrl(v.location),
    "Çevrim içi konum HTTPS olmalı",
  );
const routes = new Set([
  "/",
  "/hakkimizda",
  "/ulujam",
  "/destek",
  "/etkinlikler",
  "/duyurular",
]);
export function safeUrl(value: string) {
  if (
    routes.has(value) ||
    /^\/(etkinlikler|duyurular)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  )
    return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
}
export const announcementInput = z
  .strictObject({
    ...common,
    eventId: z.uuid().nullable().default(null),
    body: z.string().trim().min(1).max(20000),
    ctaUrl: z.string().max(2000).refine(safeUrl).nullable().default(null),
    ctaLabel: z.string().trim().min(1).max(80).nullable().default(null),
  })
  .refine(windowCheck, "Geçersiz yayın penceresi")
  .refine(
    (v) => !!v.ctaUrl === !!v.ctaLabel,
    "CTA metni ve adresi birlikte gerekir",
  );
export type ContentType = "event" | "announcement";
export type ContentRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  description: string | null;
  body: string;
  kind: string;
  categoryId: string | null;
  location: string | null;
  locationType: string;
  organizer: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  publishAt: Date | null;
  unpublishAt: Date | null;
  status: string;
  revision: number;
  capacity: number | null;
  maxTeamSize: number;
  mediaId: string | null;
  formId: string | null;
  eventId: string | null;
  ctaUrl: string | null;
  ctaLabel: string | null;
  seo: { title?: string; description?: string };
  featuredPosition: number | null;
  createdAt: Date;
};
export type PublicContent = ContentRecord & {
  displayStatus: string;
  redirectSlug?: string;
  applicationUrl: null;
  image: { id: string; altText: string; width: number; height: number } | null;
};
export function visible(row: ContentRecord, now: Date) {
  return (
    ["scheduled", "published", "ended", "cancelled"].includes(row.status) &&
    !!row.publishAt &&
    row.publishAt <= now &&
    (!row.unpublishAt || now < row.unpublishAt)
  );
}
export function displayStatus(row: ContentRecord, now: Date) {
  if (row.status === "cancelled") return "cancelled";
  if (row.status === "ended" || (row.endsAt && row.endsAt <= now))
    return "ended";
  return "published";
}
export function formatInstant(date: Date | string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(date));
}
