import "../styles/themes.css";
import "../styles/base.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { loadServerConfig } from "../lib/config/server.ts";
import { fontVariables } from "../config/fonts.ts";
import { DEFAULT_THEME } from "../config/theme.config.ts";
import { BootScript } from "../components/boot/BootScript.tsx";
import { ThemeProvider } from "../components/theme/ThemeProvider.tsx";

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
    <html lang="tr" className={fontVariables} data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head><BootScript /></head>
      <body><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
