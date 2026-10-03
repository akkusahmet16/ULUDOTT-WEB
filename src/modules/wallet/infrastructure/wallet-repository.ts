import "server-only";
import { sql } from "drizzle-orm";
import { getDatabase } from "../../../lib/database/client.ts";
import type { DbTx } from "../../../lib/database/transaction.ts";
import { readCard } from "../../cards/infrastructure/card-repository.ts";
export async function lockWalletCard(tx: DbTx, where: ReturnType<typeof sql>) {
  const initial = await readCard(where, tx);
  if (!initial) return null;
  await tx.execute(
    sql`select id from events where id=${initial.eventId}::uuid for update`,
  );
  await tx.execute(
    sql`select id from cards where id=${initial.id}::uuid for update`,
  );
  return readCard(where, tx);
}
export async function readPasses(
  cardId: string,
  db: DbTx | ReturnType<typeof getDatabase> = getDatabase(),
) {
  const rows = await db.execute(
    sql`select id,provider,object_id,status,revision,synced_revision,last_error_code,provider_state from wallet_passes where card_id=${cardId}::uuid order by provider`,
  );
  return rows.map((r) => ({
    id: String(r.id),
    provider: String(r.provider),
    objectId: String(r.object_id),
    status: String(r.status),
    revision: Number(r.revision),
    syncedRevision: Number(r.synced_revision),
    providerState: String(r.provider_state),
    lastErrorCode: r.last_error_code ? String(r.last_error_code) : null,
  }));
}
