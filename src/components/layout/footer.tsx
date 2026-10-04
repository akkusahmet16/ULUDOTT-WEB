import Link from "next/link";
import { getPublishedLinks } from "../../modules/links/application/link-service";
const destinations = [
  ["/hakkimizda", "Hakkımızda"],
  ["/ulujam", "UluJam"],
  ["/etkinlikler", "Etkinlikler"],
  ["/duyurular", "Duyurular"],
  ["/oyunlar", "Oyunlar"],
  ["/destek", "İletişim"],
  ["/admin", "Yönetim"],
] as const;
export async function Footer() {
  const socials = (await getPublishedLinks())
    .flatMap((group) => group.links)
    .filter((item) => !item.url.startsWith("/"));
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <div>
          <strong>ULUDOTT</strong>
          <p>Dijital Oyun Tasarım Topluluğu</p>
        </div>
        <div>
          <nav className="footer-map" aria-label="Site haritası">
            {destinations.map(([href, label]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>
          <nav className="footer-socials" aria-label="Sosyal medya">
            <p className="eyebrow">Sosyal medya</p>
            <div>
              {socials.length
                ? socials.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer external"
                    >
                      <span className="social-title">{item.title}</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  ))
                : ["YouTube", "WhatsApp", "Instagram"].map((name) => (
                    <span
                      key={name}
                      className="social-pending"
                      aria-disabled="true"
                    >
                      {name}
                    </span>
                  ))}
            </div>
            {!socials.length && (
              <p className="social-note">Bağlantılar eklenecek.</p>
            )}
          </nav>
          <p>Oyunlar, fikirler ve birlikte üretmek.</p>
        </div>
      </div>
    </footer>
  );
}
