import type { MetadataRoute } from "next";
import { loadServerConfig } from "../lib/config/server.ts";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/l/",
        "/basvuru",
        "/makbuz",
        "/takim",
        "/kart",
        "/yayin-onayi",
      ],
    },
    sitemap: new URL("/sitemap.xml", loadServerConfig().appUrl).toString(),
  };
}
