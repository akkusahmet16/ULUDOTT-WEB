import type { NextConfig } from "next";

const config: NextConfig = {
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
  async headers() {
    const headers = [
      { key: "Cache-Control", value: "no-store" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
    ];
    return [
      "/admin/:path*",
      "/api/admin/:path*",
      "/basvuru/:path*",
      "/makbuz",
      "/takim/:path*",
      "/kart/:path*",
      "/yayin-onayi/:path*",
      "/api/cards/:path*",
      "/api/wallet/:path*",
      "/api/team/:path*",
      "/api/ulujam/:path*",
      "/api/forms/:path*",
      "/api/submissions/:path*",
    ].map((source) => ({
      source,
      headers,
    }));
  },
};

export default config;
