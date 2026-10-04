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
          Görsel yer tutucu · İsimler, görevler ve topluluk portreleri daha
          sonra eklenecek. Başkan Yiğit görselleri eklendi; diğer yedi sahne
          geçici GTA VI referanslarıdır.
        </p>
      </div>
      {peopleReference.map((person, index) => (
        <section
          key={person.slug}
          className={`people-chapter chapter-${index}`}
          data-sky={person.color}
          id={`people-${person.slug}`}
          aria-label={
            index === 0
              ? "Başkan Yiğit"
              : `${person.referenceName} referans sahnesi`
          }
        >
          <div className="people-hero">
            <SceneVideo
              src={person.videos[0]}
              poster={person.photos[0]}
              label={
                index === 0
                  ? "Başkan Yiğit açılış videosu"
                  : `${person.referenceName} GTA VI referans klibi`
              }
              reference={index !== 0}
            />
            <div className="people-copy">
              <p className="eyebrow">
                {index === 0 ? "Başkan" : `Görsel yer tutucu / 0${index + 1}`}
              </p>
              <h2>{person.referenceName}</h2>
              <p className="people-quote">
                Birlikte üretmenin arkasındaki insanlar.
              </p>
              <p>
                {index === 0
                  ? "Uludott yönetim kurulu."
                  : "İsim, görev ve biyografi eklenecek. Bu karakter topluluk üyesi değildir; görsel düzeni göstermek için kullanılıyor."}
              </p>
            </div>
          </div>
          <PhotoGallery
            photos={person.photos.slice(0, 1)}
            name={person.referenceName}
            reference={index !== 0}
          />
        </section>
      ))}
    </section>
  );
}
