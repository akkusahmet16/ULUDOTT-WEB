import { headers } from "next/headers";
import { connection } from "next/server";
import "../styles/tokens.css";
import "../styles/cinematic.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BootScript } from "../components/boot/BootScript.tsx";
import { ThemeProvider } from "../components/theme/ThemeProvider.tsx";
import { rootFontClassName } from "../config/fonts.ts";
import { DEFAULT_THEME } from "../config/theme.config.ts";
import { getTranslator } from "../i18n/translate.ts";
import { loadServerConfig } from "../lib/config/server.ts";

const t = getTranslator("tr");

export async function generateMetadata(): Promise<Metadata> {
  await connection();
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
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="tr"
      data-theme={DEFAULT_THEME}
      className={rootFontClassName}
      suppressHydrationWarning
    >
      <head>
        <BootScript nonce={nonce} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
