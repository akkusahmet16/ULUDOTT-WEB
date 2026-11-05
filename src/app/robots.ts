import type { MetadataRoute } from "next";
import { NON_INDEXABLE_PREFIXES } from "../config/routes.config.ts";
import { loadServerConfig } from "../lib/config/server.ts";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...NON_INDEXABLE_PREFIXES],
    },
    sitemap: new URL("/sitemap.xml", loadServerConfig().appUrl).toString(),
  };
}
