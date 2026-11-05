import type { MetadataRoute } from "next";
import {
  buildRoute,
  getStaticIndexableRoutes,
} from "../config/routes.config.ts";
import { loadServerConfig } from "../lib/config/server.ts";
import {
  readIndexableGames,
  readIndexablePublications,
} from "../modules/publication/ui/public-queries.ts";

// Metadata route çıktısı yayınlardan bağımsız olarak sonsuza dek sabitlenmez.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = loadServerConfig().appUrl;
  const [events, games] = await Promise.all([
    readIndexablePublications("event"),
    readIndexableGames(),
  ]);
  return [
    ...getStaticIndexableRoutes().map((route) => ({
      url: new URL(route.path, base).toString(),
    })),
    ...events.map((item) => ({
      url: new URL(
        buildRoute("eventDetail", { slug: item.slug }),
        base,
      ).toString(),
      lastModified: item.lastModified,
    })),
    ...games.map((item) => ({
      url: new URL(
        buildRoute("gameDetail", { slug: item.slug }),
        base,
      ).toString(),
      lastModified: item.lastModified,
    })),
  ];
}
