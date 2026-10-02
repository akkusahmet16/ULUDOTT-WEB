"use client";
import Image from "next/image";
import { useState } from "react";
import { Button } from "../../../components/design-system/button";
import { Dialog } from "../../../components/design-system/dialog";
import { icons, type LinkItem, type LinkGroup } from "../domain/link";
function LinkCard({ item, baseUrl }: { item: LinkItem; baseUrl: string }) {
  const [message, setMessage] = useState(""),
    [fallback, setFallback] = useState(false),
    [qrError, setQrError] = useState(false);
  const address = new URL(`/l/${item.id}`, baseUrl).toString();
  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setFallback(false);
      setMessage("Kopyalandı.");
    } catch {
      setFallback(true);
      setMessage("Kopyalama kullanılamadı. Aşağıdaki adresi seçip kopyalayın.");
    }
  }
  const external = !item.url.startsWith("/");
  return (
    <article className="card link-card">
      <span aria-hidden="true" className="link-icon">
        {icons[item.icon as keyof typeof icons] ?? icons.link}
      </span>
      <h3>
        <a
          href={item.url}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer external" : undefined}
        >
          {item.title}
        </a>
      </h3>
      {item.description && <p>{item.description}</p>}
      {external && (
        <p className="link-note">Dış bağlantı · yeni sekmede açılır</p>
      )}
      <div className="actions">
        <Button onClick={copy}>Adresi kopyala</Button>
        <Dialog title="Bağlantı QR kodu" trigger="QR kodu">
          <p>{item.title}</p>
          <Image unoptimized
            className="link-qr"
            src={`/api/links/${item.id}/qr`}
            width={256}
            height={256}
            alt={`${item.title} için QR kodu`}
            onError={() => setQrError(true)}
          />
          {qrError && (
            <p role="status">
              QR alınamadı; bağlantı yayından kaldırılmış olabilir.
            </p>
          )}
          <label className="field">
            Kısa adres
            <input
              readOnly
              value={address}
              onFocus={(e) => e.currentTarget.select()}
            />
          </label>
          <a
            href={`/api/links/${item.id}/qr`}
            download={`uludott-${item.id}.png`}
          >
            QR görselini indir
          </a>
        </Dialog>
      </div>
      <p role="status">{message}</p>
      {fallback && (
        <label className="field">
          Kopyalanacak adres
          <input
            readOnly
            value={address}
            onFocus={(e) => e.currentTarget.select()}
          />
        </label>
      )}
    </article>
  );
}
export function LinkHub({
  groups,
  baseUrl,
}: {
  groups: LinkGroup[];
  baseUrl: string;
}) {
  const featured = groups.flatMap((g) => g.links).filter((l) => l.featured);
  return (
    <>
      {featured.length > 0 && (
        <section aria-label="Öne çıkan bağlantılar">
          <h2>Öne çıkanlar</h2>
          <div className="grid">
            {featured.map((item) => (
              <LinkCard key={item.id} item={item} baseUrl={baseUrl} />
            ))}
          </div>
        </section>
      )}
      {!groups.length && (
        <p className="empty">Henüz yayımlanmış bağlantı yok.</p>
      )}
      {groups.map((group) => (
        <section key={group.id} aria-label={group.title} className="section">
          <h2>{group.title}</h2>
          <div className="grid">
            {group.links.map((item) => (
              <LinkCard key={item.id} item={item} baseUrl={baseUrl} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
