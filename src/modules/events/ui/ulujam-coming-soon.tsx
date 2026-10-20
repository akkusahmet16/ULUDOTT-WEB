import { Countdown } from "./countdown";
import { connection } from "next/server";
import Link from "next/link";
import type { UlujamPresentation } from "../../site-settings/domain/ulujam";
export async function UlujamComingSoon({
  year,
  startAt,
  presentation,
}: {
  year: number;
  startAt: Date | null;
  presentation?: UlujamPresentation;
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
      <p className="lede">
        {presentation?.panelDescription ?? "Bir fikir. Bir takım. Bir oyun."}
      </p>
      <p>
        {startAt
          ? "Yayımlanmış tarih için geri sayım."
          : "Kesin tarih henüz yayımlanmadı."}{" "}
        {!presentation?.applicationPublished &&
          (presentation?.application.message ??
            "Başvurular henüz açılmadı. Katılım ayrıntıları ayrıca duyurulacak.")}
      </p>
      {presentation?.applicationPublished && (
        <section
          className="jam-application-callout"
          aria-label="UluJam başvuruları"
        >
          <h2>{presentation.application.title}</h2>
          <p>{presentation.application.description}</p>
          {presentation.application.url ? (
            <Link className="button" href={presentation.application.url}>
              {presentation.application.buttonLabel}
            </Link>
          ) : (
            <p role="status">{presentation.application.message}</p>
          )}
        </section>
      )}
    </section>
  );
}
