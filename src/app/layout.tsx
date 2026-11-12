import { headers } from "next/headers";
import { connection } from "next/server";
import "../styles/tokens.css";
import "../styles/cinematic.css";
import "../styles/fanzin.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BootScript } from "../components/boot/BootScript.tsx";
import { ThemeProvider } from "../components/theme/ThemeProvider.tsx";
import { rootFontClassName } from "../config/fonts.ts";
import { DEFAULT_THEME } from "../config/theme.config.ts";
import { I18nProvider } from "../i18n/client.tsx";
import { CLIENT_NAMESPACES } from "../i18n/config.ts";
import {
  getDictionarySlice,
  getLocale,
  getRequestTranslator,
} from "../i18n/server.ts";
import { loadServerConfig } from "../lib/config/server.ts";

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const [t, locale] = await Promise.all([getRequestTranslator(), getLocale()]);
  const appUrl = loadServerConfig().appUrl;
  const siteTitle = `${t("meta.home.title")} | ${t("brand.upperName")}`;
  const description = t("meta.home.description");

  return {
    metadataBase: new URL(appUrl),
    title: {
      default: siteTitle,
      template: `%s | ${t("brand.upperName")}`,
    },
    description,
    applicationName: t("brand.upperName"),
    authors: [{ name: "ULUDOTT" }],
    creator: "ULUDOTT",
    publisher: "ULUDOTT",
    keywords: [
      "ULUDOTT",
      "Uludott",
      "Dijital Oyun Tasarım Topluluğu",
      "Bursa Uludağ Üniversitesi",
      "Oyun Tasarımı",
      "Oyun Geliştirme",
      "UluJam",
      "Game Jam",
      "BUÜ",
    ],
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/icon.png", type: "image/png", sizes: "192x192" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      apple: [
        { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    openGraph: {
      type: "website",
      locale: locale === "tr" ? "tr_TR" : "en_US",
      url: appUrl,
      siteName: "ULUDOTT",
      title: siteTitle,
      description,
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: "ULUDOTT — Dijital Oyun Tasarım Topluluğu",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description,
      images: ["/opengraph-image.png"],
      creator: "@uludott",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  const [headerStore, locale, t] = await Promise.all([
    headers(),
    getLocale(),
    getRequestTranslator(),
  ]);
  const nonce = headerStore.get("x-nonce") ?? undefined;
  const dictionary = getDictionarySlice(locale, CLIENT_NAMESPACES);
  const appUrl = loadServerConfig().appUrl;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${appUrl}/#website`,
        url: appUrl,
        name: "ULUDOTT",
        alternateName: [
          "Uludott",
          "Dijital Oyun Tasarım Topluluğu",
          "BUÜ Dijital Oyun Tasarım Topluluğu",
          "Bursa Uludağ Üniversitesi Dijital Oyun Tasarım Topluluğu",
        ],
        description: t("meta.home.description"),
        inLanguage: locale,
      },
      {
        "@type": "Organization",
        "@id": `${appUrl}/#organization`,
        name: "ULUDOTT — Dijital Oyun Tasarım Topluluğu",
        url: appUrl,
        logo: `${appUrl}/icon.png`,
        sameAs: [
          "https://www.instagram.com/uludott",
          "https://x.com/uludott",
          "https://youtube.com/@uludott",
          "https://chat.whatsapp.com/G9zI4u4FOEu8Cz5AhitkVS?s=cl&p=i&mlu=4&ilr=4",
        ],
      },
    ],
  };

  return (
    <html
      lang={locale}
      data-theme={DEFAULT_THEME}
      className={rootFontClassName}
      suppressHydrationWarning
    >
      <head>
        <BootScript nonce={nonce} />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ThemeProvider>
          <I18nProvider locale={locale} dictionary={dictionary}>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
