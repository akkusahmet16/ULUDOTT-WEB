import { z } from "zod";

export const manualGameSchema = z.strictObject({
  id: z.string().min(1).max(64),
  title: z.string().trim().min(1).max(200),
  team: z.string().trim().max(300).default(""),
  image: z.string().min(1).max(500),
  description: z.string().trim().max(2000).default(""),
  itchUrl: z.string().max(500).default(""),
});

export const homepageSettingsSchema = z.strictObject({
  // İkili Kolon (Story Panels)
  storyPanels: z.strictObject({
    leftImage: z.string().min(1).max(500).default("/community/01-anasayfa/anasayfa-ulujam-panel.webp"),
    leftEyebrow: z.string().trim().max(100).default("ULUJAM"),
    leftTitle: z.string().trim().max(160).default("Birlikte üretmek"),
    leftDescription: z.string().trim().max(300).default("Fikrini oyuna dönüştür."),

    // Sol Kolon — Açılır Pencere (Modal) ve Vlog Detayları
    ulujamModalTitle: z.string().trim().max(160).default("UluJam"),
    ulujamModalEyebrow: z.string().trim().max(100).default("Birlikte üretmek"),
    ulujamModalDescription: z.string().trim().max(3000).default("UluJam maratonlarında fikirler takımlarla buluşur, 48 saatte çalışan prototiplere dönüşür."),
    ulujamVideoUrl: z.string().trim().max(1000).default("https://youtu.be/_ECGC1V__xo"),
    ulujamVideoCover: z.string().max(500).default("/community/02-ulujam/ulujam-vlog-kapak.webp"),
    ulujamVideoTitle: z.string().trim().max(160).default("UluJam vlog"),

    rightImage: z.string().min(1).max(500).default("/community/01-anasayfa/anasayfa-derece-panel.webp"),
    rightTitle: z.string().trim().max(160).default("Derece Oyunları"),
    rightDescription: z.string().trim().max(300).default("Öne çıkan topluluk yapımları."),
    
    // Sağ Kolon — Açılır Pencere (Modal) Detayları
    gamesDialogCover: z.string().min(1).max(500).default("/community/06-oyunlar/derece-oyunlari-kapak.webp"),
    gamesDialogTitle: z.string().trim().max(160).default("Derece Oyunları"),
    gamesDialogToolbar: z.string().trim().max(100).default("UluJam"),
    gamesDialogDescription: z.string().trim().max(2000).default("UluJam maratonlarında dereceye giren ve topluluğun oylarıyla öne çıkan yapımlar."),

    // Oyunlar Kolonu Modu: "ulujam_year" (Otomatik Derece) veya "custom_games" (Bizim Yaptıklarımız / Departman)
    gamesMode: z.enum(["ulujam_year", "custom_games"]).default("ulujam_year"),
    activeUlujamYear: z.number().int().min(2000).max(2200).default(2026),
    customGames: z.array(manualGameSchema).max(10).default([]),
  }),

  // People & Places — Topluluğun Dünyası
  communityWorld: z.strictObject({
    image: z.string().min(1).max(500).default("/community/03-hakkimizda/places/places-kafeler.webp"),
    eyebrow: z.string().trim().max(100).default("People & Places"),
    headingHighlight: z.string().trim().max(160).default("Topluluğun"),
    headingLine1: z.string().trim().max(160).default("dünyası."),
    copy: z.string().trim().max(2000).default(
      "İnsanlar, buluşmalar ve birlikte üretime alan açan yerler.",
    ),
    boardButtonText: z.string().trim().max(80).default("Yönetim kurulunu keşfet"),
    boardButtonUrl: z.string().trim().max(500).default("/hakkimizda#yonetim-kurulu"),
    placesButtonText: z.string().trim().max(80).default("Mekânları keşfet"),
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

    ulujamModalTitle: "UluJam",
    ulujamModalEyebrow: "Birlikte üretmek",
    ulujamModalDescription:
      "UluJam maratonlarında fikirler takımlarla buluşur, 48 saatte çalışan prototiplere dönüşür.",
    ulujamVideoUrl: "https://youtu.be/_ECGC1V__xo",
    ulujamVideoCover: "/community/02-ulujam/ulujam-vlog-kapak.webp",
    ulujamVideoTitle: "UluJam vlog",

    rightImage: "/community/01-anasayfa/anasayfa-derece-panel.webp",
    rightTitle: "Derece Oyunları",
    rightDescription: "Öne çıkan topluluk yapımları.",

    gamesDialogCover: "/community/06-oyunlar/derece-oyunlari-kapak.webp",
    gamesDialogTitle: "Derece Oyunları",
    gamesDialogToolbar: "UluJam",
    gamesDialogDescription:
      "UluJam maratonlarında dereceye giren ve topluluğun oylarıyla öne çıkan yapımlar.",

    gamesMode: "ulujam_year",
    activeUlujamYear: 2026,
    customGames: [],
  },
  communityWorld: {
    image: "/community/03-hakkimizda/places/places-kafeler.webp",
    eyebrow: "People & Places",
    headingHighlight: "Topluluğun",
    headingLine1: "dünyası.",
    copy: "İnsanlar, buluşmalar ve birlikte üretime alan açan yerler.",
    boardButtonText: "Yönetim kurulunu keşfet",
    boardButtonUrl: "/hakkimizda#yonetim-kurulu",
    placesButtonText: "Mekânları keşfet",
    placesButtonUrl: "/hakkimizda#mekanlar",
  },
};
