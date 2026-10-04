import type { ReactNode } from "react";
import { Header } from "./header";
import { ScrollMotion } from "./scroll-motion";
import { Footer } from "./footer";
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main-content" className="skip">
        İçeriğe geç
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
