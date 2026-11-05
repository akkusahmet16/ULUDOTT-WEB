import localFont from "next/font/local";

export const FONT_VARIABLES = {
  body: "--font-artdeco-body",
  display: "--font-artdeco-display",
} as const;

export const bodyFont = localFont({
  src: [
    { path: "../styles/fonts/ArtDeco-Regular.woff", weight: "400" },
    { path: "../styles/fonts/ArtDeco-Medium.woff", weight: "500" },
    { path: "../styles/fonts/ArtDeco-Bold.woff", weight: "700" },
  ],
  variable: "--font-artdeco-body",
  display: "swap",
});

export const displayFont = localFont({
  src: "../styles/fonts/ArtDeco-CondensedBold.woff",
  variable: "--font-artdeco-display",
  weight: "700",
  display: "swap",
});

export const rootFontClassName = `${bodyFont.variable} ${displayFont.variable}`;
