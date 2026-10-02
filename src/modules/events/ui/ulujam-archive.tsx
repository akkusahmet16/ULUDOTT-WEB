import Image from "next/image";
import type { HistoricalResult } from "../../games/domain/historical-result";
import type { GalleryImage } from "../application/ulujam-service";
import { ResultCard } from "../../games/ui/result-card";
import { FinalistList } from "../../games/ui/finalist-list";
export function UlujamArchive({
  year,
  results,
  gallery,
}: {
  year: number;
  results: HistoricalResult[];
  gallery: GalleryImage[];
}) {
  return (
    <section aria-label={`UluJam ${year} arşivi`} className="section">
      <h2>UluJam {year} arşivi</h2>
      <section aria-label="Arşiv galerisi">
        <h3>Galeri</h3>
        {gallery.length ? (
          <div className="grid">
            {gallery.map((image) => (
              <figure key={image.id}>
                <Image
                  unoptimized
                  src={image.src}
                  alt={image.alt}
                  width={640}
                  height={480}
                  className="event-cover"
                />
                <figcaption>{image.alt}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="empty">Henüz doğrulanmış arşiv görseli yok.</p>
        )}
      </section>
      <h3>İlk üç oyun</h3>
      {results.length ? (
        <div className="grid">
          {results.map((result) => (
            <ResultCard key={result.id} result={result} />
          ))}
        </div>
      ) : (
        <p className="empty">Henüz yayımlanmış derece bağlantısı yok.</p>
      )}
      <FinalistList />
    </section>
  );
}
