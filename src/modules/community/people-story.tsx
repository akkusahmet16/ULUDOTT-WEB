import { PhotoGallery } from "../../components/layout/photo-gallery";
import { SceneVideo } from "../../components/layout/scene-video";
import { DEFAULT_LOCALE, type Locale } from "../../i18n/config.ts";
import { getTranslator } from "../../i18n/translate.ts";
import { peopleChapters, type Chapter } from "./people-reference-data";
export function PeopleStory({
  chapters = peopleChapters,
  locale = DEFAULT_LOCALE,
}: {
  chapters?: Chapter[];
  locale?: Locale;
}) {
  const t = getTranslator(locale);
  return (
    <section
      id="yonetim-kurulu"
      className="people-story"
      aria-label={t("about.boardAria")}
    >
      <div className="people-intro">
        <p className="eyebrow">{t("about.boardEyebrow")}</p>
        <h2>{t("about.boardHeading")}</h2>
        <p className="lede">{t("about.boardLede")}</p>
      </div>
      {chapters.map((chapter, index) => (
        <section
          key={chapter.slug}
          className={`people-chapter chapter-${index}`}
          data-sky={chapter.color}
          id={`people-${chapter.slug}`}
          aria-label={chapter.title}
        >
          {chapter.video && chapter.videoVisible !== false ? (
            <div className="people-video-track">
              <div className="people-hero">
                <SceneVideo
                  src={chapter.video}
                  poster={chapter.poster}
                  label={t("about.openingVideoAria", {
                    title: chapter.title,
                  })}
                  reference={chapter.videoReference}
                />
                <div className="people-copy">
                  <p className="eyebrow">{chapter.role}</p>
                  <h2>{chapter.title}</h2>
                  <p>{t("about.boardSubtleCaption")}</p>
                </div>
              </div>
            </div>
          ) : (
            <header className="people-chapter-heading">
              <h2>{chapter.title}</h2>
            </header>
          )}
          {chapter.members.map((member) => (
            <div
              className={`people-detail${member.photo ? "" : " people-detail-text-only"}`}
              key={member.slug}
              id={`people-${member.slug}-detay`}
            >
              {member.photo && (
                <PhotoGallery
                  photos={[member.photo]}
                  name={member.name}
                  reference={member.photoReference}
                />
              )}
              <div className="people-detail-copy">
                <p className="eyebrow">{member.role}</p>
                <h3>{member.name}</h3>
                {member.quote && <p className="people-quote">{member.quote}</p>}
                {member.details.map((detail) => (
                  <p key={detail}>{detail}</p>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </section>
  );
}
