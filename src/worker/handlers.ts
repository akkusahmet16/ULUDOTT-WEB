import "server-only";
import { sql } from "drizzle-orm";
import { withTransaction, type DbTx } from "../lib/database/transaction.ts";
import { syncCardPasses } from "../modules/wallet/index.ts";
import { readCard } from "../modules/cards/infrastructure/card-repository.ts";
import { removePrivate } from "../modules/media/infrastructure/object-store.ts";
import { claimJobs, completeJob, retryOrDeadLetter } from "./claim-job.ts";
import { JobError, type ClaimedJob } from "../lib/queue/job-types.ts";

async function handleJob(tx: DbTx, job: ClaimedJob) {
  if (["card.changed", "wallet.requested"].includes(job.type)) {
    const [identity] = await tx.execute(
      sql`select a.event_id from cards c join applications a on a.id=c.application_id where c.id=${job.aggregateId}::uuid`,
    );
    if (!identity) return;
    await tx.execute(
      sql`select id from events where id=${identity.event_id}::uuid for update`,
    );
    await tx.execute(
      sql`select id from cards where id=${job.aggregateId}::uuid for update`,
    );
    const card = await readCard(sql`c.id=${job.aggregateId}::uuid`, tx);
    if (!card) return;
    // Payload/revision describes an invalidation, never a historical projection to restore.
    await tx.execute(
      sql`update cards set status=${card.status} where id=${card.id}::uuid and revision=${card.revision}`,
    );
    await syncCardPasses(tx, card);
    return;
  }
  if (job.type === "game.credit_changed") return; // Command already enqueues each affected card revision atomically.
  if (job.type === "media.deleted") {
    const [asset] = await tx.execute(
      sql`select original_key,status from media_assets where id=${job.aggregateId}::uuid`,
    );
    if (!asset || asset.status !== "deleted") return;
    const variants = await tx.execute(
      sql`select object_key from media_variants where asset_id=${job.aggregateId}::uuid`,
    );
    for (const key of [
      asset.original_key,
      ...variants.map((v) => v.object_key),
    ])
      await removePrivate(String(key));
    return;
  }
  throw new JobError("UNKNOWN_JOB");
}
export async function processBatch(workerId: string, limit = 5) {
  const jobs = await claimJobs(workerId, limit);
  for (const job of jobs) {
    try {
      await withTransaction(async (tx) => {
        const valid = await tx.execute(
          sql`select id from outbox where id=${job.id}::uuid and status='processing' and lease_owner=${job.leaseOwner} and attempts=${job.attempts} and lease_until>clock_timestamp() for update`,
        );
        if (!valid.length) throw new JobError("LEASE_LOST");
        await handleJob(tx, job);
        if (!(await completeJob(job, tx))) throw new JobError("LEASE_LOST");
      });
    } catch (error) {
      await retryOrDeadLetter(job, error);
    }
  }
  return jobs.length;
}
