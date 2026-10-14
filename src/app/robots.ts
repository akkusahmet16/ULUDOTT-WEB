import type { MetadataRoute } from "next";
import { loadServerConfig } from "../lib/config/server.ts";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/l/"] },
    sitemap: new URL("/sitemap.xml", loadServerConfig().appUrl).toString(),
  };
}
