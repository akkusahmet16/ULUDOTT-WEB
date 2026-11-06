import { z } from "zod";
import { itchUrl } from "../../games/domain/game-publication.ts";

export const manualGameSchema = z.strictObject({
  id: z.string().min(1).max(64),
  title: z.string().trim().min(1).max(200),
  team: z.string().trim().max(300).default(""),
  image: z.string().min(1).max(500),
  description: z.string().trim().max(2000).default(""),
  itchUrl,
});

export const homepageSettingsSchema = z.strictObject({
  // İkili Kolon (Story Panels)
  storyPanels: z.strictObject({
    leftImage: z.string().min(1).max(500).default("/community/01-anasayfa/anasayfa-ulujam-panel.webp"),
    leftEyebrow: z.string().trim().max(100).default("ULUJAM"),
    leftTitle: z.string().trim().max(160).default("Birlikte üretmek"),
    leftDescription: z.string().trim().max(300).default("Fikrini oyuna dönüştür."),

    rightImage: z.string().min(1).max(500).default("/community/01-anasayfa/anasayfa-derece-panel.webp"),
    rightTitle: z.string().trim().max(160).default("Derece Oyunları"),
    rightDescription: z.string().trim().max(300).default("Öne çıkan topluluk yapımları."),
    
    // Oyunlar Kolonu Modu: "ulujam_year" (Otomatik Derece) veya "custom_games" (Bizim Yaptıklarımız / Departman)
    gamesMode: z.enum(["ulujam_year", "custom_games"]).default("ulujam_year"),
    activeUlujamYear: z.number().int().min(2020).max(2100).default(2026),
    customGames: z.array(manualGameSchema).max(10).default([]),
  }),

  // People & Places — Topluluğun Dünyası
  communityWorld: z.strictObject({
    image: z.string().min(1).max(500).default("/theme/reference/venue-2.avif"),
    eyebrow: z.string().trim().max(100).default("TOPLULUĞUN DÜNYASI"),
    headingLine1: z.string().trim().max(160).default("Oyunlar, mekanlar ve"),
    headingHighlight: z.string().trim().max(160).default("birlikte üretim."),
    copy: z.string().trim().max(2000).default(
      "Görükle’nin kafelerinden amfilere, atölyelerden oyun gecelerine uzanan yaşayan bir ekosistem.",
    ),
    boardButtonText: z.string().trim().max(80).default("Yönetim Kurulunu Keşfet"),
    boardButtonUrl: z.string().trim().max(500).default("/hakkimizda#yonetim-kurulu"),
    placesButtonText: z.string().trim().max(80).default("Mekanları Keşfet"),
    placesButtonUrl: z.string().trim().max(500).default("/hakkimizda#mekanlar"),
  }),
});

export type HomepageSettings = z.infer<typeof homepageSettingsSchema>;
export type ManualGame = z.infer<typeof manualGameSchema>;

export const defaultHomepageSettings: HomepageSettings = {
  storyPanels: {
    leftImage: "/community/01-anasayfa/anasayfa-ulujam-panel.webp",
    leftEyebrow: "ULUJAM",
    leftTitle: "Birlikte üretmek",
    leftDescription: "Fikrini oyuna dönüştür.",

    rightImage: "/community/01-anasayfa/anasayfa-derece-panel.webp",
    rightTitle: "Derece Oyunları",
    rightDescription: "Öne çıkan topluluk yapımları.",

    gamesMode: "ulujam_year",
    activeUlujamYear: 2026,
    customGames: [],
  },
  communityWorld: {
    image: "/theme/reference/venue-2.avif",
    eyebrow: "TOPLULUĞUN DÜNYASI",
    headingLine1: "Oyunlar, mekanlar ve",
    headingHighlight: "birlikte üretim.",
    copy: "Görükle’nin kafelerinden amfilere, atölyelerden oyun gecelerine uzanan yaşayan bir ekosistem.",
    boardButtonText: "Yönetim Kurulunu Keşfet",
    boardButtonUrl: "/hakkimizda#yonetim-kurulu",
    placesButtonText: "Mekanları Keşfet",
    placesButtonUrl: "/hakkimizda#mekanlar",
  },
};
