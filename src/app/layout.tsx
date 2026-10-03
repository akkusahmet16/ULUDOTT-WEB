import { connection } from "next/server";
import "../styles/tokens.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";

const bodyFont = localFont({
  src: "../styles/fonts/Outfit.ttf",
  variable: "--font-body",
  weight: "100 900",
  display: "swap",
});
const displayFont = localFont({
  src: "../styles/fonts/BarlowCondensed-Bold.ttf",
  variable: "--font-display",
  weight: "700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Uludott — Dijital Oyun Tasarım Topluluğu",
  description: "Uludott topluluğu için etkinlik ve oyun üretim platformu.",
  robots: { index: false, follow: false },
};

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
