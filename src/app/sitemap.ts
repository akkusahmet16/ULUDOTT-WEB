import type { MetadataRoute } from "next";
import {
  buildRoute,
  getStaticIndexableRoutes,
} from "../config/routes.config.ts";
import { loadServerConfig } from "../lib/config/server.ts";
import { readIndexableGames } from "../modules/publication/ui/public-queries.ts";

// Metadata route çıktısı yayınlardan bağımsız olarak sonsuza dek sabitlenmez.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = loadServerConfig().appUrl;
  const games = await readIndexableGames();
  return [
    ...getStaticIndexableRoutes().map((route) => ({
      url: new URL(route.path, base).toString(),
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
