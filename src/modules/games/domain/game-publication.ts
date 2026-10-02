import { z } from "zod";
import { historical2026 } from "./historical-result.ts";
export const publicationName = z.string().trim().min(1).max(160);
export const itchUrl = z
  .string()
  .max(500)
  .refine((value) => {
    try {
      const u = new URL(value);
      return (
        u.protocol === "https:" &&
        /^[a-z0-9-]+\.itch\.io$/.test(u.hostname) &&
        !u.port &&
        !u.username &&
        !u.password &&
        u.pathname.length > 1 &&
        !u.hash &&
        !/[\s\\]/.test(value) &&
        value === u.href
      );
    } catch {
      return false;
    }
  }, "Geçerli HTTPS itch.io oyun adresi gerekli");
export const gameDraft = z.strictObject({
  id: z.uuid().optional(),
  expectedRevision: z.int().positive().optional(),
  title: z.string().trim().min(1).max(200).nullable(),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100)
    .nullable(),
  description: z.string().trim().min(1).max(10000).nullable(),
  teamId: z.uuid().nullable(),
  editorialTeamName: z.string().trim().min(1).max(200).nullable().optional(),
  mediaId: z.uuid().nullable(),
  itchUrl,
  historicalPartial: z.boolean().optional(),
  credits: z
    .array(
      z.strictObject({
        id: z.uuid().optional(),
        applicationId: z.uuid().nullable(),
        publicationName: publicationName.nullable(),
      }),
    )
    .max(20),
});
export const isHistoricalGame = (eventId: string, id: string) =>
  eventId === historical2026.eventId &&
  historical2026.results.some((r) => r.id === id);
export function assertFullGame(
  g: {
    title: string | null;
    slug: string | null;
    description: string | null;
    teamId: string | null;
    editorialTeamName: string | null;
    historicalPartial: boolean;
    eventId: string;
    id: string;
  },
  credits: { publicationName: string | null; consentedAt: Date | null }[],
) {
  if (g.historicalPartial) {
    if (!isHistoricalGame(g.eventId, g.id))
      throw Error("Kısmi kayıt yalnız 2026 arşivinde kullanılabilir");
    return;
  }
  if (
    !g.title ||
    !g.slug ||
    !g.description ||
    (!g.teamId && !(isHistoricalGame(g.eventId, g.id) && g.editorialTeamName))
  )
    throw Error("Tam oyun bilgisi gerekli");
  if (
    !credits.length ||
    credits.some((c) => !c.publicationName || !c.consentedAt)
  )
    throw Error("Yapımcı yayın adı için açık rıza/onay gerekli");
}
