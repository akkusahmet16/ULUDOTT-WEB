import Image from "next/image";
import type { CardView } from "../application/card-service";
import { PendingCard } from "./pending-card";
import styles from "./web-card.module.css";
export function WebCard({ card }: { card: CardView }) {
  return (
    <article className={styles.ticket} aria-label="Bireysel katılım kartı">
      <p className={styles.brand}>ULUDOTT / ULUJAM</p>
      <h1>{card.eventTitle}</h1>
      <p className={styles.name}>{card.name}</p>
      <p>{card.teamName ?? "Bireysel katılım"}</p>
      {card.startsAt && (
        <time dateTime={card.startsAt}>
          {new Date(card.startsAt).toLocaleString("tr-TR", {
            timeZone: "Europe/Istanbul",
          })}
        </time>
      )}
      <p>
        Kart durumu:{" "}
        <strong>
          {card.status === "active"
            ? "Aktif"
            : card.status === "pending"
              ? "Onay bekliyor"
              : "İptal"}
        </strong>
      </p>
      {card.status === "active" ? (
        <section aria-label="Giriş kimliği">
          {card.qr ? (
            <>
              <Image
                src={card.qr}
                alt="Etkinlik giriş QR kodu"
                width={280}
                height={280}
                unoptimized
              />
              <p>
                Bu QR yalnız etkinlik giriş kimliğinizdir. Kart bağlantınızı
                başkalarıyla paylaşmayın.
              </p>
            </>
          ) : (
            <p>Giriş kimliği için etkinlik yöneticisiyle iletişime geçin.</p>
          )}
        </section>
      ) : (
        <PendingCard status={card.status} />
      )}
      <p className={styles.foot}>
        ULUDOTT COMMUNITY · KART SÜRÜMÜ {card.revision}
      </p>
    </article>
  );
}
