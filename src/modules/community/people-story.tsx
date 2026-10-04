import Image from "next/image";
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
          sonra eklenecek. Aşağıdaki sekiz sahne GTA VI karakter
          referanslarıdır.
        </p>
      </div>
      {peopleReference.map((person, index) => (
        <section
          key={person.slug}
          className={`people-chapter chapter-${index}`}
          data-sky={person.color}
          id={`people-${person.slug}`}
          aria-label={`${person.referenceName} referans sahnesi`}
        >
          <div className="people-hero">
            {person.foreground ? (
              <>
                <Image
                  className="people-hero-bg"
                  src={person.background}
                  alt=""
                  width={2560}
                  height={1440}
                  unoptimized
                />
                <Image
                  className="people-hero-fg"
                  src={person.foreground}
                  alt=""
                  width={2560}
                  height={1440}
                  unoptimized
                />
              </>
            ) : (
              <SceneVideo
                src={person.videos[0]}
                poster={person.background}
                label={`${person.referenceName} GTA VI referans klibi`}
              />
            )}
            <div className="people-copy">
              <p className="eyebrow">Görsel yer tutucu / 0{index + 1}</p>
              <h2>{person.referenceName}</h2>
              <p className="people-quote">
                Birlikte üretmenin arkasındaki insanlar.
              </p>
              <p>
                İsim, görev ve biyografi eklenecek. Bu karakter topluluk üyesi
                değildir; görsel düzeni göstermek için kullanılıyor.
              </p>
            </div>
          </div>
          <PhotoGallery photos={person.photos} name={person.referenceName} />
          <div className="people-clip">
            <SceneVideo
              src={person.videos.at(-1)!}
              poster={person.photos[0]}
              label={`${person.referenceName} GTA VI kısa klibi`}
            />
            <div>
              <p className="eyebrow">Birlikte / Görsel yer tutucu</p>
              <h3>
                Fikirler.
                <br />
                İnsanlar.
                <br />
                Oyunlar.
              </h3>
              <p>
                Topluluk biyografisi ve üyeye ait görüntüler daha sonra bu akışa
                eklenecek.
              </p>
            </div>
          </div>
        </section>
      ))}
    </section>
  );
}
