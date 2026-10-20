import type { MetadataRoute } from "next";
import { loadServerConfig } from "../lib/config/server.ts";
import { readIndexablePublications } from "../modules/publication/ui/public-queries.ts";

// Metadata route çıktısı yayınlardan bağımsız olarak sonsuza dek sabitlenmez.
// Veri okumaları 30 sn TTL ve yayın etiketleriyle yönetilir.
export const dynamic = "force-dynamic";

const publicPaths = [
  "/",
  "/hakkimizda",
  "/ulujam",
  "/etkinlikler",
  "/oyunlar",
  "/iletisim",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = loadServerConfig().appUrl;
  const events = await readIndexablePublications("event");
  return [
    ...publicPaths.map((path) => ({ url: new URL(path, base).toString() })),
    ...events.map((item) => ({
      url: new URL(`/etkinlikler/${item.slug}`, base).toString(),
      lastModified: item.lastModified,
    })),
  ];
}
