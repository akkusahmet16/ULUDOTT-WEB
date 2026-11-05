import type { ReactNode } from "react";
import { getTranslator } from "../../i18n/translate.ts";
import { Header } from "./header";
import { ScrollMotion } from "./scroll-motion";
import { Footer } from "./footer";

const t = getTranslator("tr");

export function PublicShell({ children }: { children: ReactNode }) {
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
