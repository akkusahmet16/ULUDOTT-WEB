import "server-only";
import { teamRate } from "../../teams/application/team-rate.ts";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "../../../lib/database/client.ts";
import { withTransaction } from "../../../lib/database/transaction.ts";
import { events, games, gameCredits } from "../../../db/schema/content.ts";
import { tokenHash } from "../../../lib/auth/crypto.ts";
import { SubmissionError } from "../../forms/domain/submission-error.ts";
import { gameCardsChanged } from "./game-service.ts";
import {
  publicationName,
  isHistoricalGame,
} from "../domain/game-publication.ts";
import { readCard } from "../../cards/infrastructure/card-repository.ts";
import { enqueue } from "../../../lib/queue/outbox.ts";
const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
async function creditByToken(token: string) {
  if (!tokenSchema.safeParse(token).success)
    throw new SubmissionError(404, "Yayın onayı bulunamadı");
  const [c] = await getDatabase()
    .select()
    .from(gameCredits)
    .where(eq(gameCredits.consentTokenHash, tokenHash(token)));
  if (!c) throw new SubmissionError(404, "Yayın onayı bulunamadı");
  return c;
}
export async function getPublicationConsent(token: string) {
  const c = await creditByToken(token);
  const [g] = await getDatabase()
    .select()
    .from(games)
    .where(eq(games.id, c.gameId));
  const [e] = await getDatabase()
    .select()
    .from(events)
    .where(eq(events.id, g.eventId));
  if (["cancelled", "archived"].includes(e.status))
    throw new SubmissionError(410, "Yayın onayı kapalı");
  if (c.applicationId) {
    const r = await readCard(sql`c.application_id=${c.applicationId}::uuid`);
    if (!r || r.expired)
      throw new SubmissionError(410, "Başvurunun saklama süresi doldu");
  }
  return {
    title: g.title ?? "Başlığı henüz girilmemiş oyun",
    event: e.title,
    publicationName: c.publicationName ?? "",
    consented: !!c.consentedAt,
    revision: c.revision,
  };
}
export async function approvePublicationName(
  token: string,
  name: string,
  consent: boolean,
  expectedRevision?: number,
) {
  tokenSchema.parse(token);
  await teamRate("credit_consent", token, 20);
  const initial = await creditByToken(token);
  if (consent) publicationName.parse(name);
  z.boolean().parse(consent);
  return withTransaction(async (tx) => {
    const [initialGame] = await tx
      .select()
      .from(games)
      .where(eq(games.id, initial.gameId));
    const [e] = await tx
      .select()
      .from(events)
      .where(eq(events.id, initialGame.eventId))
      .for("update");
    if (consent && ["cancelled", "archived"].includes(e.status))
      throw new SubmissionError(410, "Yayın onayı kapalı");
    const [g] = await tx
      .select()
      .from(games)
      .where(eq(games.id, initial.gameId))
      .for("update");
    const [c] = await tx
      .select()
      .from(gameCredits)
      .where(eq(gameCredits.consentTokenHash, tokenHash(token)))
      .for("update");
    if (!c || c.gameId !== g.id)
      throw new SubmissionError(404, "Yayın onayı bulunamadı");
    if (
      consent &&
      expectedRevision !== undefined &&
      expectedRevision !== c.revision
    )
      throw Error("Sürüm çakışması");
    if (consent && c.applicationId) {
      const r = await readCard(
        sql`c.application_id=${c.applicationId}::uuid`,
        tx,
      );
      if (!r || r.expired || r.status !== "active")
        throw new SubmissionError(
          403,
          "Yayın onayı için aktif katılım gerekli",
        );
    } else if (consent && !isHistoricalGame(g.eventId, g.id))
      throw new SubmissionError(403, "Yayın onayı uygun değil");
    await tx
      .update(gameCredits)
      .set({
        publicationName: consent ? name.trim() : null,
        consentedAt: consent ? sql`now()` : null,
        revision: c.revision + 1,
      })
      .where(eq(gameCredits.id, c.id));
    const revision = g.revision + 1;
    await tx
      .update(games)
      .set({ publishedAt: null, revision })
      .where(eq(games.id, g.id));
    await gameCardsChanged(tx, [g.teamId]);
    await enqueue(tx, "game.credit_changed", g.id, revision, { gameId: g.id });
    return { revision: c.revision + 1, consented: consent };
  });
}
