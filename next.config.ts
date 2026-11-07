import type { NextConfig } from "next";
import { NEXT_CONFIG_PRIVATE_HEADER_SOURCES } from "./src/config/routes.config.ts";

const config: NextConfig = {
  distDir: process.env.ULUDOTT_E2E_BUILD_DIR || ".next",
  output: "standalone",
  logging: {
    incomingRequests: {
      ignore: [/^\/(kart|takim|yayin-onayi)\//, /^\/api\/wallet\/google\//],
    },
    serverFunctions: false,
  },
  outputFileTracingExcludes: {
    "/*": [
      "./Media/**/*",
      "./Uludott Logo Pack/**/*",
      "./Wallet secrets/**/*",
      "./.env*",
      "./.local/**/*",
      "./.superpowers/**/*",
      "./.worktrees/**/*",
      "./**/*.{pem,key,p12,pfx,pkpass,heic,HEIC}",
    ],
  },
  outputFileTracingIncludes: {
    "/api/admin/media": [
      "./node_modules/sharp/**/*",
      "./node_modules/libheif-js/**/*",
      "./node_modules/.pnpm/@img+sharp*/node_modules/@img/sharp*/**/*.{js,json,node,dylib,so,wasm}",
      "./node_modules/.pnpm/@img+sharp*/node_modules/@img/sharp*/lib/*.so.*",
    ],
  },
  serverExternalPackages: ["sharp", "libheif-js"],
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
    proxyClientMaxBodySize: "100mb",
  },
  async headers() {
    const headers = [
      { key: "Cache-Control", value: "no-store" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
    ];
    return NEXT_CONFIG_PRIVATE_HEADER_SOURCES.map((source) => ({
      source,
      headers,
    }));
  },
};

export default config;
