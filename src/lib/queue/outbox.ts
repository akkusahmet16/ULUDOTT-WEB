import "server-only";
import { z } from "zod";
import type { DbTx } from "../database/transaction.ts";
import { outbox } from "../../db/schema/operations.ts";
const job = z.object({
  type: z
    .string()
    .regex(/^[a-z_]+\.[a-z_]+$/)
    .max(100),
  aggregateId: z.uuid(),
  revision: z.int().positive(),
  payload: z.partialRecord(
    z.enum([
      "eventId",
      "applicationId",
      "teamId",
      "cardId",
      "mediaId",
      "gameId",
      "submissionId",
      "passId",
    ]),
    z.uuid(),
  ),
});
export async function enqueue(
  tx: DbTx,
  type: string,
  aggregateId: string,
  revision: number,
  payload: Record<string, unknown>,
): Promise<void> {
  const parsed = job.safeParse({ type, aggregateId, revision, payload });
  if (!parsed.success) throw new Error("Geçersiz outbox iş metadata.");
  // Sağlayıcı sırları veya kişi alanları yerine kimlikler gönderilir; worker güncel kaydı okur.
  await tx
    .insert(outbox)
    .values(parsed.data)
    .onConflictDoNothing({
      target: [outbox.type, outbox.aggregateId, outbox.revision],
    });
}
