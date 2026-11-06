import { z } from "zod";
import { itchUrl } from "./game-publication.ts";
export const siteGameInput = z
  .strictObject({
    title: z.string().trim().min(1, "Oyun başlığı zorunludur").max(200),
    label: z.string().trim().max(120).default("Yayımlanmış oyun"),
    credit: z.string().trim().max(300).default(""),
    description: z.string().trim().max(10000).default(""),
    image: z.string().max(500).default(""),
    alt: z.string().trim().max(250).default(""),
    href: z.string().max(500).default(""),
    position: z.int().min(0).max(10000).default(100),
    published: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.published) {
      if (!data.credit.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Oyunu yayımlamak için ekip/yapımcı bilgisi zorunludur",
          path: ["credit"],
        });
      }
      if (!data.image.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Oyunu yayımlamak için oyun kapağı görseli zorunludur",
          path: ["image"],
        });
      }
      const itchRes = itchUrl.safeParse(data.href);
      if (!itchRes.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Oyunu yayımlamak için geçerli bir HTTPS itch.io adresi zorunludur",
          path: ["href"],
        });
      }
    } else {
      if (data.href && data.href.trim() !== "") {
        const itchRes = itchUrl.safeParse(data.href);
        if (!itchRes.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Geçerli HTTPS itch.io oyun adresi gerekli",
            path: ["href"],
          });
        }
      }
    }
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
