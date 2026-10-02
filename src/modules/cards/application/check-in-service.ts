import "server-only";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { withTransaction } from "../../../lib/database/transaction.ts";
import { getDatabase } from "../../../lib/database/client.ts";
import { cards } from "../../../db/schema/wallet.ts";
import { events } from "../../../db/schema/content.ts";
import { randomToken, tokenHash } from "../../../lib/auth/crypto.ts";
import { encryptReplay } from "../../forms/infrastructure/submission-repository.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import { appendAudit, type Actor } from "../../../lib/logging/audit.ts";
import { SubmissionError } from "../../forms/domain/submission-error.ts";
import { readCard } from "../infrastructure/card-repository.ts";
import { cardToken } from "./card-service.ts";
import { enqueue } from "../../../lib/queue/outbox.ts";
export async function resolveCheckIn(actor: Actor, token: string) {
  cardToken.parse(token);
  const r = await readCard(sql`c.checkin_token_hash=${tokenHash(token)}`);
  if (!r) throw new SubmissionError(404, "Check-in bulunamadı");
  requirePermission(actor, "cards.read", r.eventId);
  if (r.expired || r.status !== "active")
    throw new SubmissionError(403, "Kart aktif değil");
  return {
    id: r.id,
    name: r.name,
    event: r.eventTitle,
    team: r.teamName,
    revision: r.revision,
  };
}
export async function rotateCheckIn(
  actor: Actor,
  id: string,
  expectedRevision: number,
) {
  z.uuid().parse(id);
  z.int().positive().parse(expectedRevision);
  const initial = await readCard(sql`c.id=${id}::uuid`, getDatabase());
  if (!initial) throw new SubmissionError(404, "Kart bulunamadı");
  requirePermission(actor, "teams.write", initial.eventId);
  return withTransaction(async (tx) => {
    await tx
      .select({ id: events.id })
      .from(events)
      .where(eq(events.id, initial.eventId))
      .for("update");
    const [c] = await tx
      .select()
      .from(cards)
      .where(eq(cards.id, id))
      .for("update");
    if (c.revision !== expectedRevision) throw Error("Sürüm çakışması");
    const token = randomToken(),
      revision = c.revision + 1;
    await tx
      .update(cards)
      .set({
        checkinTokenHash: tokenHash(token),
        checkinTokenEncrypted: encryptReplay({ token }, "check-in:" + id),
        revision,
      })
      .where(eq(cards.id, id));
    await enqueue(tx, "card.changed", id, revision, {
      cardId: id,
      applicationId: c.applicationId,
    });
    await appendAudit(
      tx,
      actor,
      "card.checkin_rotated",
      { type: "card", id },
      { revision },
    );
    return { id, revision };
  });
}
