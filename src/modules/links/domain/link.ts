import { validateExternalUrl } from "../../../lib/security/url-policy.ts";
import { z } from "zod";
export const icons = {
  link: "↗",
  community: "◎",
  calendar: "▦",
  game: "✦",
  video: "▶",
  document: "▤",
} as const;
export const staticPaths = new Set([
  "/",
  "/hakkimizda",
  "/ulujam",
  "/iletisim",
  "/etkinlikler",
  "/oyunlar",
]);
export function validLinkUrl(value: string) {
  if (/[\s\\\u0000-\u001f\u007f]/u.test(value)) return false;
  if (
    staticPaths.has(value) ||
    /^\/(etkinlikler)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  )
    return true;
  try {
    validateExternalUrl(value, "link");
    return true;
  } catch {
    return false;
  }
}
const instant = z
  .union([z.iso.datetime({ offset: true }), z.date()])
  .transform((x) => new Date(x))
  .nullable()
  .default(null);
export const groupInput = z.strictObject({
  id: z.uuid().optional(),
  expectedRevision: z.int().positive().optional(),
  title: z.string().trim().min(1).max(80),
  position: z.int().min(0).max(9999),
});
export const linkInput = z
  .strictObject({
    id: z.uuid().optional(),
    expectedRevision: z.int().positive().optional(),
    groupId: z.uuid(),
    title: z.string().trim().min(1).max(150),
    url: z
      .string()
      .min(1)
      .max(2000)
      .refine(validLinkUrl, "Geçersiz bağlantı adresi"),
    description: z.string().trim().max(500).nullable().default(null),
    icon: z
      .enum(["link", "community", "calendar", "game", "video", "document"])
      .default("link"),
    position: z.int().min(0).max(9999),
    published: z.boolean().default(false),
    featured: z.boolean().default(false),
    verified: z.boolean().default(false),
    startsAt: instant,
    endsAt: instant,
  })
  .refine(
    (v) => !v.endsAt || (!!v.startsAt && v.endsAt > v.startsAt),
    "Geçersiz yayın aralığı",
  );
export type LinkItem = {
  id: string;
  groupId: string;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  position: number;
  published: boolean;
  featured: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  revision: number;
  verifiedAt: Date | null;
};
export type LinkGroup = {
  id: string;
  title: string;
  position: number;
  revision: number;
  links: LinkItem[];
};
