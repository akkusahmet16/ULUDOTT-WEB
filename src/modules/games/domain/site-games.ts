import { z } from "zod";
import { itchUrl } from "./game-publication.ts";
export const siteGameInput = z.strictObject({
  title: z.string().trim().min(1).max(200),
  label: z.string().trim().min(1).max(120),
  credit: z.string().trim().min(1).max(300),
  description: z.string().trim().max(10000),
  image: z.string().min(1).max(500),
  alt: z.string().trim().min(1).max(250),
  href: itchUrl,
  position: z.int().min(0).max(10000),
  published: z.boolean(),
});
export type SiteGameFields = z.infer<typeof siteGameInput>;
export type SiteGame = SiteGameFields & { id: string; revision: number };
export const defaultSiteGames: SiteGame[] = [
  {
    id: "57ec6120-57ab-4be4-a992-4537b7781201",
    revision: 0,
    title: "No Time To Die",
    label: "Yayımlanmış oyun",
    credit: "Altay Turan · Headlong",
    description: "",
    image: "/community/06-oyunlar/yayimlanan/no-time-to-die.webp",
    alt: "No Time To Die",
    href: "https://altay434.itch.io/no-time-to-die",
    position: 10,
    published: true,
  },
  {
    id: "57ec6120-57ab-4be4-a992-4537b7781202",
    revision: 0,
    title: "InFrame",
    label: "UluJam 2025 · 2. derece",
    credit: "Team Vazos",
    description: "",
    image: "/community/06-oyunlar/yayimlanan/inframe.webp",
    alt: "InFrame",
    href: "https://farukb.itch.io/inframe",
    position: 20,
    published: true,
  },
];
