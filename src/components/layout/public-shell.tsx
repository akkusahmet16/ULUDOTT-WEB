import type { ReactNode } from "react";
import { getRequestTranslator } from "../../i18n/server.ts";
import { Header } from "./header";
import { ScrollMotion } from "./scroll-motion";
import { Footer } from "./footer";

export async function PublicShell({ children }: { children: ReactNode }) {
  const t = await getRequestTranslator();
  return (
    <>
      <a href="#main-content" className="skip">
        {t("nav.skipToContent")}
      </a>
      <Header />
      <ScrollMotion />
      <main id="main-content" tabIndex={-1}>
        <div className="wrap">{children}</div>
      </main>
      <Footer />
    </>
  );
}
