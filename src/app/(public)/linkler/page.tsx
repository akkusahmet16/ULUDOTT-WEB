import type { Metadata } from "next";
import Image from "next/image";
import { PublicShell } from "../../../components/layout/public-shell";
import { getPublishedLinks } from "../../../modules/links/application/link-service";
import { LinkHub } from "../../../modules/links/ui/link-hub";
import { loadServerConfig } from "../../../lib/config/server";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Uludott bağlantıları",
  description: "Topluluğun yayımlanmış adresleri, tek yerde.",
};
export default async function Page() {
  return (
    <PublicShell>
      <section className="section">
        <div className="link-profile">
          <Image
            src="/brand/uludott-white.svg"
            alt="Uludott"
            width={80}
            height={80}
          />
          <h1>Uludott bağlantıları</h1>
          <p className="lede">Topluluğun yayımlanmış adresleri, tek yerde.</p>
        </div>
        <LinkHub
          groups={await getPublishedLinks()}
          baseUrl={loadServerConfig().appUrl}
        />
      </section>
    </PublicShell>
  );
}
