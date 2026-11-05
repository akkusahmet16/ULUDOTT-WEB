import { PublicShell } from "../../../components/layout/public-shell";
import { ButtonLink } from "../../../components/design-system/button";
import { readContactSettings } from "../../../modules/publication/ui/public-queries";
import { SocialIcon } from "../../../modules/site-settings/ui/social-icon";
import { buildMetadata } from "../../../seo/build-metadata.ts";
import styles from "./contact.module.css";
export async function generateMetadata() {
  const { data } = await readContactSettings();
  return buildMetadata({
    routeId: "contact",
    content: {
      title: data.title,
      description: data.description,
    },
  });
}
export default async function Page() {
  const { data } = await readContactSettings();
  const socials = data.socials.filter((social) => social.contact);
  return (
    <PublicShell>
      <section className="hero">
        <p className="eyebrow">İletişim</p>
        <h1>{data.title}</h1>
        <p className="lede">{data.description}</p>
        <ButtonLink href="/hakkimizda">Topluluğu tanı</ButtonLink>
      </section>
      <section
        className={`section ${styles.channels}`}
        aria-label="İletişim kanalları"
      >
        <h2>{data.channelsTitle}</h2>
        <div className={styles.contacts}>
          {data.email && (
            <a className={styles.card} href={`mailto:${data.email}`}>
              <span className="eyebrow">E-posta</span>
              <span className={styles.value}>{data.email}</span>
              <span className={styles.action}>E-posta gönder ↗</span>
            </a>
          )}
          {data.phone && (
            <a
              className={styles.card}
              href={`tel:${data.phone.replace(/[ ()-]/g, "")}`}
            >
              <span className="eyebrow">Telefon</span>
              <span className={styles.value}>{data.phone}</span>
              <span className={styles.action}>Bizi ara ↗</span>
            </a>
          )}
        </div>
        {socials.length > 0 && (
          <nav
            className={styles.socials}
            aria-label="Sosyal medya hesaplarımız"
          >
            {socials.map((social) => (
              <a
                key={social.id}
                href={social.url}
                aria-label={social.title}
                target="_blank"
                rel="noopener noreferrer external"
              >
                <SocialIcon icon={social.icon} />
              </a>
            ))}
          </nav>
        )}
      </section>
    </PublicShell>
  );
}
