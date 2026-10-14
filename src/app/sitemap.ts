import type { MetadataRoute } from "next";
import { loadServerConfig } from "../lib/config/server.ts";
import { listIndexablePublications } from "../modules/publication/service.ts";

// Metadata route çıktısı yayınlardan bağımsız olarak sonsuza dek sabitlenmez.
// Veri önbelleği 0.4'te okuma fonksiyonu etiketleriyle yönetilir.
export const dynamic = "force-dynamic";

// FAZ-2: routes.config.ts'e taşınacak
const publicPaths = ["/", "/hakkimizda", "/ulujam", "/etkinlikler", "/duyurular", "/oyunlar", "/linkler", "/destek"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = loadServerConfig().appUrl;
  const [events, announcements] = await Promise.all([
    listIndexablePublications("event"),
    listIndexablePublications("announcement"),
  ]);
  return [
    ...publicPaths.map(path => ({ url: new URL(path, base).toString() })),
    ...events.map(item => ({ url: new URL(`/etkinlikler/${item.slug}`, base).toString(), lastModified: item.lastModified })),
    ...announcements.map(item => ({ url: new URL(`/duyurular/${item.slug}`, base).toString(), lastModified: item.lastModified })),
  ];
}
