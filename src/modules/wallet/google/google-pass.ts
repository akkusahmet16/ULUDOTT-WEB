import "server-only";
export type GoogleCard = {
  id: string;
  eventId: string;
  revision: number;
  name: string;
  eventTitle: string;
  teamName: string | null;
  checkinToken: string;
  status: "pending" | "active" | "revoked";
  rank: number | null;
  finalist: boolean;
};
export function googleObjectId(issuerId: string, cardId: string) {
  return issuerId + ".uludott_" + cardId.replaceAll("-", "");
}
export function googleClassId(issuerId: string, eventId: string) {
  return issuerId + ".ulujam_" + eventId.replaceAll("-", "");
}
const localized = (value: string) => ({
  defaultValue: { language: "tr-TR", value },
});
export function buildGooglePass(
  card: GoogleCard,
  issuerId: string,
): Record<string, unknown> {
  return {
    id: googleObjectId(issuerId, card.id),
    classId: googleClassId(issuerId, card.eventId),
    genericType: "GENERIC_OTHER",
    state: card.status === "active" ? "ACTIVE" : "INACTIVE",
    cardTitle: localized("Uludott / UluJam"),
    header: localized(card.name),
    subheader: localized(card.eventTitle),
    hexBackgroundColor: "#19202B",
    barcode: {
      type: "QR_CODE",
      value: "uludott:check-in:" + card.checkinToken,
    },
    textModulesData: [
      {
        id: "team",
        header: "Katılım",
        body: card.teamName ?? "Bireysel katılım",
      },
      {
        id: "award",
        header: "Derece",
        body: card.rank
          ? card.rank + ". sıra"
          : card.finalist
            ? "Finalist"
            : "Katılımcı",
      },
      { id: "revision", header: "Kart sürümü", body: String(card.revision) },
    ],
  };
}
