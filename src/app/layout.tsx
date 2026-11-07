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
  const t = await getRequestTranslator();
  return {
    metadataBase: new URL(loadServerConfig().appUrl),
    title: {
      default: `${t("meta.home.title")} | ${t("brand.upperName")}`,
      template: `%s | ${t("brand.upperName")}`,
    },
    description: t("meta.home.description"),
  };
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  const [headerStore, locale] = await Promise.all([headers(), getLocale()]);
  const nonce = headerStore.get("x-nonce") ?? undefined;
  const dictionary = getDictionarySlice(locale, CLIENT_NAMESPACES);
  return (
    <html
      lang={locale}
      data-theme={DEFAULT_THEME}
      className={rootFontClassName}
      suppressHydrationWarning
    >
      <head>
        <BootScript nonce={nonce} />
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
