import Image from "next/image";
import type { ArchiveFields } from "../../site-settings/domain/archives";
export function UlujamArchive({ archive }: { archive: ArchiveFields }) {
  return (
    <section aria-label={`UluJam ${archive.year} arşivi`} className="section">
      <h2>UluJam {archive.year} arşivi</h2>
      {archive.description && <p className="lede">{archive.description}</p>}
      <section aria-label="Arşiv galerisi">
        <h3>Galeri</h3>
        {archive.gallery.length ? (
          <div className="archive-gallery-mosaic">
            {archive.gallery.map((image, index) => (
              <figure
                key={`${image.src}:${index}`}
                className={`archive-gallery-item ${index === 0 ? "archive-gallery-featured" : "archive-gallery-side"}`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={640}
                  height={480}
                  sizes={index === 0
                    ? "(max-width: 699px) 100vw, (max-width: 1500px) 67vw, 960px"
                    : "(max-width: 699px) 100vw, (max-width: 1500px) 33vw, 460px"}
                  className="event-cover"
                />
                <figcaption>
                  <span className="eyebrow">
                    UluJam {archive.year} / {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{image.alt}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="empty">Henüz doğrulanmış arşiv görseli yok.</p>
        )}
      </section>
      <h3>İlk üç oyun</h3>
      {archive.games.length ? (
        <div className="grid degree-games">
          {[...archive.games]
            .sort((a, b) => a.rank - b.rank)
            .map((game) => (
              <article className="degree-game-card" key={game.rank}>
                <Image
                  src={game.image}
                  alt={game.title}
                  width={1600}
                  height={900}
                  sizes="(max-width: 699px) 100vw, (max-width: 1500px) 33vw, 470px"
                />
                <p className="eyebrow">{game.rank}. derece</p>
                <h3>{game.title}</h3>
                {game.team && <p>{game.team}</p>}
                {game.description && <p>{game.description}</p>}
                <a
                  href={game.itchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {game.title} oyununu itch.io’da aç
                </a>
              </article>
            ))}
        </div>
      ) : (
        <p className="empty">Henüz yayımlanmış derece bağlantısı yok.</p>
      )}
    </section>
  );
}
