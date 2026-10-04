import type { PublicGameView } from "../../games/infrastructure/game-repository";
import Image from "next/image";
import type { HistoricalResult } from "../../games/domain/historical-result";
import type { GalleryImage } from "../application/ulujam-service";
import { degreeGames } from "../../games/domain/degree-games";
export function UlujamArchive({
  year,
  results,
  gallery,
}: {
  year: number;
  results: (HistoricalResult | PublicGameView)[];
  gallery: GalleryImage[];
}) {
  return (
    <section aria-label={`UluJam ${year} arşivi`} className="section">
      <h2>UluJam {year} arşivi</h2>
      <section aria-label="Arşiv galerisi">
        <h3>Galeri</h3>
        {gallery.length ? (
          <div className="archive-gallery-mosaic">
            {gallery.map((image, index) => (
              <figure
                key={image.id}
                className={`archive-gallery-item ${
                  index === 0
                    ? "archive-gallery-featured"
                    : "archive-gallery-side"
                }`}
              >
                <Image
                  unoptimized
                  src={image.src}
                  alt={image.alt}
                  width={640}
                  height={480}
                  className="event-cover"
                />
                <figcaption>
                  <span className="eyebrow">UluJam 2026 / 0{index + 1}</span>
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
      {results.length ? (
        <div className="grid degree-games">
          {results.map((result, index) => {
            const game = degreeGames[index];
            if (!game) return null;
            return (
              <article className="degree-game-card" key={result.id}>
                <Image
                  src={game.image}
                  alt={game.title}
                  width={1600}
                  height={900}
                  sizes="(max-width: 699px) 100vw, 33vw"
                />
                <p className="eyebrow">{index + 1}. derece</p>
                <h3>{game.title}</h3>
                <a
                  href={result.itchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {game.title} oyununu itch.io’da aç
                </a>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="empty">Henüz yayımlanmış derece bağlantısı yok.</p>
      )}
    </section>
  );
}
