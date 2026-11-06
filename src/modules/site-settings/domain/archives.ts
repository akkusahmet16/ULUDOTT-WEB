import { z } from "zod";
import { itchUrl } from "../../games/domain/game-publication.ts";
import { degreeGames } from "../../games/domain/degree-games.ts";
import { historical2026 } from "../../games/domain/historical-result.ts";
export const archiveGameSchema = z.strictObject({
  rank: z.int().min(1).max(3),
  title: z.string().trim().max(200).default(""),
  team: z.string().trim().max(300).default(""),
  image: z.string().max(500).default(""),
  itchUrl: z.string().max(500).default(""),
  description: z.string().trim().max(2000).default(""),
});
export const archiveSchema = z
  .strictObject({
    year: z.int().min(2000).max(2200),
    description: z.string().trim().max(3000).default(""),
    position: z.int().min(0).max(10000).default(0),
    published: z.boolean().default(false),
    gallery: z
      .array(
        z.strictObject({
          src: z.string().max(500).default(""),
          alt: z.string().trim().max(250).default(""),
        }),
      )
      .max(50),
    games: z.array(archiveGameSchema).max(3),
  })
  .superRefine((data, ctx) => {
    if (
      new Set(data.games.map((game) => game.rank)).size !== data.games.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Aynı derece iki kez kullanılamaz",
        path: ["games"],
      });
    }
    if (data.published) {
      for (let i = 0; i < data.games.length; i++) {
        const g = data.games[i];
        if (!g.title.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${g.rank}. derece oyunu için oyun adı zorunludur`,
            path: ["games", i, "title"],
          });
        }
        if (!g.image.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${g.rank}. derece oyunu için kapak görseli zorunludur`,
            path: ["games", i, "image"],
          });
        }
        const itchRes = itchUrl.safeParse(g.itchUrl);
        if (!itchRes.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${g.rank}. derece oyunu için geçerli bir HTTPS itch.io adresi zorunludur`,
            path: ["games", i, "itchUrl"],
          });
        }
      }
    } else {
      for (let i = 0; i < data.games.length; i++) {
        const g = data.games[i];
        if (g.itchUrl && g.itchUrl.trim() !== "") {
          const itchRes = itchUrl.safeParse(g.itchUrl);
          if (!itchRes.success) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `${g.rank}. derece oyunu için geçerli HTTPS itch.io adresi gerekli`,
              path: ["games", i, "itchUrl"],
            });
          }
        }
      }
    }
  });
export type ArchiveFields = z.infer<typeof archiveSchema>;
export type ArchiveGame = z.infer<typeof archiveGameSchema>;
export type Archive = ArchiveFields & { revision: number };
export const defaultArchive2026: ArchiveFields = {
  year: 2026,
  description: "",
  position: 10,
  published: true,
  gallery: [1, 2, 3].map((n) => ({
    src: `/community/02-ulujam/2026-arsiv/ulujam-2026-galeri-0${n}.webp`,
    alt: `UluJam 2026 — topluluktan kare ${n}`,
  })),
  games: degreeGames.map((game, index) => ({
    rank: index + 1,
    title: game.title,
    image: game.image,
    team: "",
    description: "",
    itchUrl: historical2026.results[index].itchUrl,
  })),
};
