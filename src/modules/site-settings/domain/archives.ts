import { z } from "zod";
import { itchUrl } from "../../games/domain/game-publication.ts";
import { degreeGames } from "../../games/domain/degree-games.ts";
import { historical2026 } from "../../games/domain/historical-result.ts";
export const archiveGameSchema = z.strictObject({
  rank: z.int().min(1).max(3),
  title: z.string().trim().min(1).max(200),
  team: z.string().trim().max(300),
  image: z.string().min(1).max(500),
  itchUrl,
  description: z.string().trim().max(2000),
});
export const archiveSchema = z
  .strictObject({
    year: z.int().min(2000).max(2200),
    description: z.string().trim().max(3000),
    position: z.int().min(0).max(10000),
    published: z.boolean(),
    gallery: z
      .array(
        z.strictObject({
          src: z.string().min(1).max(500),
          alt: z.string().trim().min(1).max(250),
        }),
      )
      .max(50),
    games: z.array(archiveGameSchema).max(3),
  })
  .refine(
    (data) =>
      new Set(data.games.map((game) => game.rank)).size === data.games.length,
    "Aynı derece iki kez kullanılamaz",
  );
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
