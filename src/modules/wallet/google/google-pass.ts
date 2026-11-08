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

export function googleCommunityClassId(issuerId: string) {
  return `${issuerId}.uludott_community_pass`;
}

export function googleCommunityObjectId(issuerId: string, grantId?: string) {
  if (grantId) {
    return `${issuerId}.uludott_community_${grantId.replaceAll("-", "")}`;
  }
  return `${issuerId}.uludott_community_pass_default`;
}

export function buildCommunityClass(
  issuerId: string,
  appOrigin: string,
): Record<string, unknown> {
  const classId = googleCommunityClassId(issuerId);
  const assetsOrigin = process.env.WALLET_ASSETS_ORIGIN || appOrigin;
  const isHttps = assetsOrigin.startsWith("https://");

  return {
    id: classId,
    genericType: "GENERIC_OTHER",
    cardTitle: localized("Uludott Community Pass"),
    header: localized("COMMUNITY PASS"),
    subheader: localized("Dijital Oyun Tasarım Topluluğu"),
    hexBackgroundColor: "#19202B",
    ...(isHttps
      ? {
          logo: {
            sourceUri: {
              uri: `${assetsOrigin}/passes/community/primaryLogo@2x.png`,
            },
            contentDescription: localized("Uludott Logo"),
          },
          heroImage: {
            sourceUri: {
              uri: `${assetsOrigin}/passes/community/background@2x.png`,
            },
            contentDescription: localized("Uludott Community Pass"),
          },
        }
      : {}),
  };
}

export function buildCommunityObject(
  issuerId: string,
  appOrigin: string,
  grantId?: string,
): Record<string, unknown> {
  const objectId = googleCommunityObjectId(issuerId, grantId);
  const classId = googleCommunityClassId(issuerId);
  const assetsOrigin = process.env.WALLET_ASSETS_ORIGIN || appOrigin;
  const isHttps = assetsOrigin.startsWith("https://");

  return {
    id: objectId,
    classId,
    genericType: "GENERIC_OTHER",
    state: "ACTIVE",
    cardTitle: localized("Uludott Community Pass"),
    header: localized("COMMUNITY PASS"),
    subheader: localized("Dijital Oyun Tasarım Topluluğu"),
    hexBackgroundColor: "#19202B",
    ...(isHttps
      ? {
          logo: {
            sourceUri: {
              uri: `${assetsOrigin}/passes/community/primaryLogo@2x.png`,
            },
            contentDescription: localized("Uludott Logo"),
          },
          heroImage: {
            sourceUri: {
              uri: `${assetsOrigin}/passes/community/background@2x.png`,
            },
            contentDescription: localized("Uludott Community Pass"),
          },
        }
      : {}),
    textModulesData: [
      {
        id: "motto",
        header: "Slogan",
        body: "Sadece bir kart değil, ortak deneyim bileti",
      },
    ],
  };
}

