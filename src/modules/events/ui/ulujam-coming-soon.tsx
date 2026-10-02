import { Countdown } from "./countdown";
export function UlujamComingSoon({
  year,
  startAt,
}: {
  year: number;
  startAt: Date | null;
}) {
  return (
    <section aria-label={`UluJam ${year}`} className="section">
      <p className="eyebrow">Birlikte üretmenin yeni yılı</p>
      <h1>UluJam {year}</h1>
      <Countdown
        startAt={startAt?.toISOString() ?? null}
        initialNow={new Date().toISOString()}
      />
      <p className="lede">Bir fikir. Bir takım. Bir oyun.</p>
      <p>
        {startAt
          ? "Yayımlanmış tarih için geri sayım."
          : "Kesin tarih henüz yayımlanmadı."}{" "}
        Başvurular henüz açılmadı. Katılım ayrıntıları ayrıca duyurulacak.
      </p>
    </section>
  );
}
