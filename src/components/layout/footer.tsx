import Link from "next/link";
const destinations = [
  ["/hakkimizda", "Hakkımızda"],
  ["/ulujam", "UluJam"],
  ["/etkinlikler", "Etkinlikler"],
  ["/duyurular", "Duyurular"],
  ["/oyunlar", "Oyunlar"],
  ["/linkler", "Bağlantılar"],
  ["/destek", "Destek"],
  ["/admin", "Yönetim"],
] as const;
export function Footer() {
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
          <p>Oyunlar, fikirler ve birlikte üretmek.</p>
        </div>
      </div>
    </footer>
  );
}
