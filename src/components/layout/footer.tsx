import { getTranslator } from "../../i18n/translate.ts";
import { readContactSettings } from "../../modules/publication/ui/public-queries";
import { SocialIcon } from "../../modules/site-settings/ui/social-icon";

const t = getTranslator("tr");

export async function Footer() {
  const { data } = await readContactSettings();
  const socials = data.socials.filter((social) => social.footer);
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <div>
          <strong>{t("brand.upperName")}</strong>
          <p>{data.footerDescription}</p>
        </div>
        <div>
          {socials.length > 0 && (
            <nav className="footer-socials" aria-label={t("footer.socialsAria")}>
              <p className="eyebrow">{t("footer.socialsEyebrow")}</p>
              <div>
                {socials.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    aria-label={item.title}
                    target="_blank"
                    rel="noopener noreferrer external"
                  >
                    <SocialIcon icon={item.icon} size={24} />
                  </a>
                ))}
              </div>
            </nav>
          )}
          <p>{data.footerTagline}</p>
        </div>
      </div>
    </footer>
  );
}
