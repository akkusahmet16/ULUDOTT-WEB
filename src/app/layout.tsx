import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Uludott — Dijital Oyun Tasarım Topluluğu",
  description: "Uludott topluluğu için etkinlik ve oyun üretim platformu.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="tr"><body>{children}</body></html>;
}
