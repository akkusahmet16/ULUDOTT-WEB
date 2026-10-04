import { PhotoGallery } from "../../components/layout/photo-gallery";
import { SceneVideo } from "../../components/layout/scene-video";
import { peopleChapters, type Chapter } from "./people-reference-data";
export function PeopleStory({
  chapters = peopleChapters,
}: {
  chapters?: Chapter[];
}) {
  return (
    <section
      id="yonetim-kurulu"
      className="people-story"
      aria-label="Yönetim kurulu"
    >
      <div className="people-intro">
        <p className="eyebrow">Topluluğun insanları</p>
        <h2>Yönetim kurulu.</h2>
        <p className="lede">Birlikte üreten topluluğun arkasındaki ekip.</p>
      </div>
      {chapters.map((chapter, index) => (
        <section
          key={chapter.slug}
          className={`people-chapter chapter-${index}`}
          data-sky={chapter.color}
          id={`people-${chapter.slug}`}
          aria-label={chapter.title}
        >
          <div className="people-video-track">
            <div className="people-hero">
              <SceneVideo
                src={chapter.video}
                poster={chapter.poster}
                label={`${chapter.title} açılış videosu`}
                reference={chapter.videoReference}
              />
              <div className="people-copy">
                <p className="eyebrow">{chapter.role}</p>
                <h2>{chapter.title}</h2>
                <p>Uludott Yönetim Kurulu</p>
              </div>
            </div>
          </div>
          {chapter.members.map((member) => (
            <div
              className="people-detail"
              key={member.slug}
              id={`people-${member.slug}-detay`}
            >
              <PhotoGallery
                photos={[member.photo]}
                name={member.name}
                reference={member.photoReference}
              />
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
