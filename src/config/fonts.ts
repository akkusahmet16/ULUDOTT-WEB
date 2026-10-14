import { Press_Start_2P, Space_Grotesk, VT323 } from "next/font/google";

// Sunucu localStorage tercihini bilmez. Koşulsuz preload classic'te de font
// indirirdi; yüzler yalnız seçilen temanın CSS'i kullandığında yüklenir.
export const displayFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-display-face",
  preload: false,
});
export const bodyFont = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-body-face",
  preload: false,
});
export const labelFont = VT323({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-label-face",
  preload: false,
});

export const fontVariables = [displayFont.variable, bodyFont.variable, labelFont.variable].join(" ");
