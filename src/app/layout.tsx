import "../styles/themes.css";
import "../styles/base.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { loadServerConfig } from "../lib/config/server.ts";
import { fontVariables } from "../config/fonts.ts";

export const metadata: Metadata = {
  metadataBase: new URL(loadServerConfig().appUrl),
  title: {
    default: "Dijital Oyun Tasarım Topluluğu | ULUDOTT",
    template: "%s | ULUDOTT",
  },
  description: "Uludott topluluğu için etkinlik ve oyun üretim platformu.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
