import { PhotoGallery } from "../../components/layout/photo-gallery";
import { SceneVideo } from "../../components/layout/scene-video";
import { peopleReference } from "./people-reference-data";
export function PeopleStory() {
  return (
    <section
      id="yonetim-kurulu"
      className="people-story"
      aria-label="Yönetim kurulu"
    >
      <div className="people-intro">
        <p className="eyebrow">People / Topluluğun insanları</p>
        <h2>Yönetim kurulu.</h2>
        <p className="lede">Birlikte üreten topluluğun arkasındaki ekip.</p>
        <p className="placeholder-note">
          Eksik topluluk fotoğrafı ve videosu bulunan alanlarda geçici GTA VI
          görselleri kullanılıyor.
        </p>
      </div>
      {peopleReference.map((person, index) => (
        <section
          key={person.slug}
          className={`people-chapter chapter-${index}`}
          data-sky={person.color}
          id={`people-${person.slug}`}
          aria-label={index === 0 ? "Başkan Yiğit" : person.name}
        >
          <div className="people-hero">
            <SceneVideo
              src={person.videos[0]}
              poster={person.photos[0]}
              label={
                person.videoReference
                  ? `${person.name} GTA VI referans klibi`
                  : `${person.name} açılış videosu`
              }
              reference={person.videoReference}
            />
            <div className="people-copy">
              <p className="eyebrow">{person.role}</p>
              <h2>{person.referenceName}</h2>
              {person.quote && <p className="people-quote">{person.quote}</p>}
              <p>Uludott Yönetim Kurulu</p>
            </div>
          </div>
          <div className="people-detail">
            <PhotoGallery
              photos={person.photos}
              name={person.name}
              reference={person.photoReference}
            />
            {!!person.details.length && (
              <div className="people-detail-copy">
                <p className="eyebrow">{person.role}</p>
                <h3>{person.name}</h3>
                {person.details.map((detail) => (
                  <p key={detail}>{detail}</p>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}
    </section>
  );
}
