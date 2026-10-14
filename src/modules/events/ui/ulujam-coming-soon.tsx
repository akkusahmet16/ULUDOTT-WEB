import { Countdown } from "./countdown";
import { connection } from "next/server";
export async function UlujamComingSoon({
  year,
  startAt,
}: {
  year: number;
  startAt: Date | null;
}) {
  // Veri 30 sn önbellekli olabilir; initialNow her istekte taze olmalıdır.
  await connection();
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
