import Image from "next/image";
export function SuppliedPoster({ kind }: { kind: "event" | "announcement" }) {
  const event = kind === "event";
  return (
    <figure
      className={`supplied-poster ${event ? "event-poster" : "announcement-poster"}`}
    >
      <Image
        src={
          event
            ? "/community/04-etkinlikler/etkinlik-coffe-talk/etkinlik-coffe-talk-afis.webp"
            : "/community/05-duyurular/duyuru-valorant/duyuru-valorant-afis.webp"
        }
        alt={
          event
            ? "Uludott tanışma etkinliği — Coffee Talk afişi"
            : "Uludott Valorant turnuvası afişi"
        }
        width={1080}
        height={event ? 1350 : 1600}
        unoptimized
      />
      <figcaption>
        {event
          ? "Uludott tanışma etkinliği · Coffee Talk"
          : "Valorant turnuvası"}
      </figcaption>
    </figure>
  );
}
