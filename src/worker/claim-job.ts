import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "../lib/database/client.ts";
import { withTransaction, type DbTx } from "../lib/database/transaction.ts";
import {
  MAX_ATTEMPTS,
  LEASE_SECONDS,
  jobErrorCode,
  type ClaimedJob,
} from "../lib/queue/job-types.ts";
import type { Actor } from "../lib/logging/audit.ts";
import { appendAudit } from "../lib/logging/audit.ts";
import { requirePermission } from "../modules/admin/domain/permissions.ts";

export async function claimJobs(
  workerId: string,
  limit: number,
): Promise<ClaimedJob[]> {
  z.string()
    .regex(/^[A-Za-z0-9_-]{1,80}$/)
    .parse(workerId);
  z.int().min(1).max(50).parse(limit);
  const owner = workerId + ":" + randomUUID();
  return withTransaction(async (tx) => {
    await tx.execute(
      sql`update outbox set status='dead',lease_owner=null,lease_until=null,last_error_code='LEASE_EXPIRED' where status='processing' and lease_until<=clock_timestamp() and attempts>=${MAX_ATTEMPTS}`,
    );
    const rows = await tx.execute(sql`with picked as (
   select id from outbox where attempts<${MAX_ATTEMPTS} and ((status='pending' and available_at<=clock_timestamp()) or (status='processing' and lease_until<=clock_timestamp()))
   order by available_at,created_at,id for update skip locked limit ${limit}
  ) update outbox o set status='processing',attempts=o.attempts+1,lease_owner=${owner},lease_until=clock_timestamp()+${LEASE_SECONDS}*interval '1 second'
  from picked where o.id=picked.id returning o.*`);
    return rows.map((r) => ({
      id: String(r.id),
      type: String(r.type),
      aggregateId: String(r.aggregate_id),
      revision: Number(r.revision),
      payload: r.payload as Record<string, string>,
      attempts: Number(r.attempts),
      leaseOwner: String(r.lease_owner),
    }));
  });
}
export async function completeJob(job: ClaimedJob, tx?: DbTx) {
  const db = tx ?? getDatabase();
  const rows = await db.execute(
    sql`update outbox set status='completed',lease_owner=null,lease_until=null,last_error_code=null where id=${job.id}::uuid and status='processing' and lease_owner=${job.leaseOwner} and attempts=${job.attempts} and lease_until>clock_timestamp() returning id`,
  );
  return rows.length === 1;
}
export async function retryOrDeadLetter(
  job: ClaimedJob,
  error: unknown,
  tx?: DbTx,
) {
  const delay =
    Math.min(300, 2 ** Math.min(job.attempts, 8)) * (0.5 + Math.random() * 0.5);
  const rows = await (tx ?? getDatabase()).execute(
    sql`update outbox set status=${job.attempts >= MAX_ATTEMPTS ? "dead" : "pending"},available_at=clock_timestamp()+${delay}*interval '1 second',lease_owner=null,lease_until=null,last_error_code=${jobErrorCode(error)} where id=${job.id}::uuid and status='processing' and lease_owner=${job.leaseOwner} and attempts=${job.attempts} and lease_until>clock_timestamp() returning id`,
  );
  return rows.length === 1;
}
export async function retryJob(actor: Actor, jobId: string) {
  requirePermission(actor, "system.read");
  z.uuid().parse(jobId);
  return withTransaction(async (tx) => {
    const rows = await tx.execute(
      sql`update outbox set status='pending',attempts=0,available_at=clock_timestamp(),lease_owner=null,lease_until=null,last_error_code=null where id=${jobId}::uuid and status='dead' returning id`,
    );
    if (!rows.length) throw Error("Yeniden denenecek iş bulunamadı");
    await appendAudit(
      tx,
      actor,
      "outbox.retried",
      { type: "outbox", id: jobId },
      { changedFields: ["status"] },
    );
  });
}
