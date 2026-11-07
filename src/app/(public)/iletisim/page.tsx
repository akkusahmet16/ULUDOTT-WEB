import { PublicShell } from "../../../components/layout/public-shell";
import { ButtonLink } from "../../../components/design-system/button";
import { readContactSettings } from "../../../modules/publication/ui/public-queries";
import { SocialIcon } from "../../../modules/site-settings/ui/social-icon";
import { getLocale } from "../../../i18n/server.ts";
import { getTranslator } from "../../../i18n/translate.ts";
import { buildMetadata } from "../../../seo/build-metadata.ts";
import styles from "./contact.module.css";
export async function generateMetadata() {
  const [{ data }, locale] = await Promise.all([
    readContactSettings(),
    getLocale(),
  ]);
  return buildMetadata({
    routeId: "contact",
    locale,
    ...(locale === "tr"
      ? {
          content: {
            title: data.title,
            description: data.description,
          },
        }
      : {}),
  });
}
export default async function Page() {
  const [{ data }, locale] = await Promise.all([
    readContactSettings(),
    getLocale(),
  ]);
  const t = getTranslator(locale);
  const socials = data.socials.filter((social) => social.contact);
  return (
    <PublicShell>
      <section className="hero">
        <p className="eyebrow">{t("contact.eyebrow")}</p>
        <h1>{data.title}</h1>
        <p className="lede">{data.description}</p>
        <ButtonLink href="/hakkimizda">
          {t("common.discoverCommunity")}
        </ButtonLink>
      </section>
      <section
        className={`section ${styles.channels}`}
        aria-label={t("contact.channelsAria")}
      >
        <h2>{data.channelsTitle}</h2>
        <div className={styles.contacts}>
          {data.email && (
            <a className={styles.card} href={`mailto:${data.email}`}>
              <span className="eyebrow">{t("contact.emailEyebrow")}</span>
              <span className={styles.value}>{data.email}</span>
              <span className={styles.action}>{t("contact.emailAction")}</span>
            </a>
          )}
          {data.phone && (
            <a
              className={styles.card}
              href={`tel:${data.phone.replace(/[ ()-]/g, "")}`}
            >
              <span className="eyebrow">{t("contact.phoneEyebrow")}</span>
              <span className={styles.value}>{data.phone}</span>
              <span className={styles.action}>{t("contact.phoneAction")}</span>
            </a>
          )}
        </div>
        {socials.length > 0 && (
          <nav
            className={styles.socials}
            aria-label={t("contact.socialsAria")}
          >
            {socials.map((social) =>
              social.icon === "text" ? (
                <a
                  key={social.id}
                  href={social.url}
                  className="contact-text-link"
                  target="_blank"
                  rel="noopener noreferrer external"
                >
                  <span>{social.title}</span>
                  <span aria-hidden="true" className="contact-text-arrow">
                    ↗
                  </span>
                </a>
              ) : (
                <a
                  key={social.id}
                  href={social.url}
                  aria-label={social.title}
                  className={styles.iconLink}
                  target="_blank"
                  rel="noopener noreferrer external"
                >
                  <SocialIcon icon={social.icon} />
                </a>
              ),
            )}
          </nav>
        )}
      </section>
    </PublicShell>
  );
}
