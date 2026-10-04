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
  const communitySocials = [
    {
      id: "instagram",
      title: "Instagram",
      url: "https://www.instagram.com/uludott",
      logo: "instagram",
    },
    {
      id: "whatsapp",
      title: "WhatsApp",
      url: "https://chat.whatsapp.com/G9zI4u4FOEu8Cz5AhitkVS?s=cl&p=i&mlu=4&ilr=4",
      logo: "whatsapp",
    },
    { id: "x", title: "X", url: "https://x.com/uludott", logo: "x" },
    {
      id: "youtube",
      title: "YouTube",
      url: "https://youtube.com/@uludott",
      logo: "youtube",
    },
  ];
  const published = (await getPublishedLinks())
    .flatMap((group) => group.links)
    .filter((item) => !item.url.startsWith("/"));
  const socials = [
    ...published.map((item) => ({
      ...item,
      logo: communitySocials.find((social) => social.url === item.url)?.logo,
    })),
    ...communitySocials.filter(
      (social) => !published.some((item) => item.url === social.url),
    ),
  ];
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
              {socials.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  aria-label={item.title}
                  target="_blank"
                  rel="noopener noreferrer external"
                >
                  {item.logo ? (
                    // Static brand SVGs are copied unchanged into the public preview.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="social-logo"
                      src={`/brand/social/${item.logo}.svg`}
                      width="24"
                      height="24"
                      alt=""
                      aria-hidden="true"
                    />
                  ) : (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2" />
                    </svg>
                  )}
                </a>
              ))}
            </div>
          </nav>
          <p>Oyunlar, fikirler ve birlikte üretmek.</p>
        </div>
      </div>
    </footer>
  );
}
