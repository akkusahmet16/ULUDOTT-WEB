import { connection } from "next/server";
import "../styles/tokens.css";
import "../styles/cinematic.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { loadServerConfig } from "../lib/config/server.ts";

const bodyFont = localFont({
  src: [
    { path: "../styles/fonts/ArtDeco-Regular.woff", weight: "400" },
    { path: "../styles/fonts/ArtDeco-Medium.woff", weight: "500" },
    { path: "../styles/fonts/ArtDeco-Bold.woff", weight: "700" },
  ],
  variable: "--font-body",
  display: "swap",
});
const displayFont = localFont({
  src: "../styles/fonts/ArtDeco-CondensedBold.woff",
  variable: "--font-display",
  weight: "700",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  return {
    metadataBase: new URL(loadServerConfig().appUrl),
    title: {
      default: "Uludott — Dijital Oyun Tasarım Topluluğu | ULUDOTT",
      template: "%s | ULUDOTT",
    },
    description: "Uludott topluluğu için etkinlik ve oyun üretim platformu.",
  };
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  return (
    <html lang="tr" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
