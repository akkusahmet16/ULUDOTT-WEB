import { z } from "zod";

export const placeSceneSchema = z.strictObject({
  id: z.string().min(1).max(64),
  title: z.string().trim().min(1).max(160),
  image: z.string().min(1).max(500),
  names: z.array(z.string().trim().min(1).max(120)).max(30),
});

export const placesSettingsSchema = z.strictObject({
  eyebrow: z.string().trim().max(100).default("MEKANLAR"),
  heading: z.string().trim().max(200).default("Ürettiğimiz, buluştuğumuz ve paylaştığımız alanlar."),
  scenes: z.array(placeSceneSchema).max(10).default([]),
});

export type PlaceScene = z.infer<typeof placeSceneSchema>;
export type PlacesSettings = z.infer<typeof placesSettingsSchema>;

export const defaultPlacesSettings: PlacesSettings = {
  eyebrow: "MEKANLAR",
  heading: "Ürettiğimiz, buluştuğumuz ve paylaştığımız alanlar.",
  scenes: [
    {
      id: "scene-cafes",
      title: "Kafeler & Buluşma Noktaları",
      image: "/community/03-hakkimizda/places/places-kafeler.webp",
      names: [
        "Ecem Kafe & Oyun",
        "Nest'o Coffee Roastery",
        "Müptela Kahve",
      ],
    },
    {
      id: "scene-venues",
      title: "Salonlar & Etkinlik Alanları",
      image: "/community/03-hakkimizda/places/places-salonlar.webp",
      names: [
        "Çamlık Personel Yemekhanesi",
        "Mete Cengiz Kültür Merkezi",
      ],
    },
  ],
};
