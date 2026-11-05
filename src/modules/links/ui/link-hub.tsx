"use client";
import Image from "next/image";
import { useState } from "react";
import { Button } from "../../../components/design-system/button";
import { Dialog } from "../../../components/design-system/dialog";
import { useTranslator } from "../../../i18n/client.tsx";
import { icons, type LinkItem, type LinkGroup } from "../domain/link";
function LinkCard({ item, baseUrl }: { item: LinkItem; baseUrl: string }) {
  const t = useTranslator();
  const [message, setMessage] = useState(""),
    [fallback, setFallback] = useState(false),
    [qrError, setQrError] = useState(false);
  const address = new URL(`/l/${item.id}`, baseUrl).toString();
  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setFallback(false);
      setMessage(t("links.copied"));
    } catch {
      setFallback(true);
      setMessage(t("links.copyFallback"));
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
      {external && <p className="link-note">{t("links.externalNote")}</p>}
      <div className="actions">
        <Button onClick={copy}>{t("links.copyAddress")}</Button>
        <Dialog
          title={t("links.qrDialogTitle")}
          trigger={t("links.qrTrigger")}
        >
          <p>{item.title}</p>
          <Image
            unoptimized
            className="link-qr"
            src={`/api/links/${item.id}/qr`}
            width={256}
            height={256}
            alt={t("links.qrImageAlt", { title: item.title })}
            onError={() => setQrError(true)}
          />
          {qrError && <p role="status">{t("links.qrErrorStatus")}</p>}
          <label className="field">
            {t("links.shortAddressLabel")}
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
            {t("links.downloadQr")}
          </a>
        </Dialog>
      </div>
      <p role="status">{message}</p>
      {fallback && (
        <label className="field">
          {t("links.fallbackAddressLabel")}
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
  const t = useTranslator();
  const featured = groups.flatMap((g) => g.links).filter((l) => l.featured);
  return (
    <>
      {featured.length > 0 && (
        <section aria-label={t("links.featuredAria")}>
          <h2>{t("links.featuredHeading")}</h2>
          <div className="grid">
            {featured.map((item) => (
              <LinkCard key={item.id} item={item} baseUrl={baseUrl} />
            ))}
          </div>
        </section>
      )}
      {!groups.length && <p className="empty">{t("links.emptyLinks")}</p>}
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
