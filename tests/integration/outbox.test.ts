import { it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { withTransaction } from "../../src/lib/database/transaction";
import { enqueue } from "../../src/lib/queue/outbox";
import {
  claimJobs,
  completeJob,
  retryOrDeadLetter,
  retryJob,
} from "../../src/worker/claim-job";

// Catches nontransactional enqueue, double claims and acknowledgements by expired owners.
it("Rollback, duplicate enqueue, concurrent claim and expired lease fencing", async () => {
  const x = await ulujamFixture();
  try {
    const id = randomUUID();
    await expect(
      withTransaction(async (tx) => {
        await enqueue(tx, "card.changed", id, 1, { cardId: id });
        throw Error("ROLLBACK");
      }),
    ).rejects.toThrow("ROLLBACK");
    expect((await x.sql`select count(*)::int n from outbox`)[0].n).toBe(0);
    await withTransaction(async (tx) => {
      await enqueue(tx, "card.changed", id, 1, { cardId: id });
      await enqueue(tx, "card.changed", id, 1, { cardId: id });
    });
    const [a, b] = await Promise.all([claimJobs("a", 1), claimJobs("b", 1)]);
    expect(a.length + b.length).toBe(1);
    const old = [...a, ...b][0];
    await x.sql`update outbox set lease_until=now()-interval '1 second' where id=${old.id}`;
    const [fresh] = await claimJobs("a", 1);
    expect(fresh.attempts).toBe(2);
    expect(await completeJob(old)).toBe(false);
    expect(
      await retryOrDeadLetter(old, Error("secret@example.com +905551234567")),
    ).toBe(false);
    expect(await completeJob(fresh)).toBe(true);
    expect(await claimJobs("c", 1)).toHaveLength(0);
  } finally {
    await x.cleanup();
  }
});
it("Backoff, bounded attempts, redacted error and authorized manual retry", async () => {
  const x = await ulujamFixture();
  try {
    const id = randomUUID();
    await withTransaction((tx) =>
      enqueue(tx, "card.changed", id, 1, { cardId: id }),
    );
    let job = (await claimJobs("retry", 1))[0];
    await retryOrDeadLetter(job, Error("private secret +905551234567"));
    const [r] =
      await x.sql`select status,last_error_code,extract(epoch from available_at-now())::float d from outbox where id=${job.id}`;
    expect(r.status).toBe("pending");
    expect(r.d).toBeGreaterThan(0);
    expect(r.d).toBeLessThanOrEqual(5);
    expect(r.last_error_code).toBe("JOB_FAILED");
    expect(await claimJobs("retry", 1)).toHaveLength(0);
    for (let n = 2; n <= 5; n++) {
      await x.sql`update outbox set available_at=now()-interval '1 second' where id=${job.id}`;
      job = (await claimJobs("retry", 1))[0];
      await retryOrDeadLetter(job, Error("private"));
    }
    expect(
      (await x.sql`select status,attempts from outbox where id=${job.id}`)[0],
    ).toMatchObject({ status: "dead", attempts: 5 });
    await expect(retryJob(x.actor, job.id)).rejects.toThrow("Yetki yok");
    await retryJob({ ...x.actor, roles: ["system_admin"] }, job.id);
    expect((await claimJobs("retry", 1))[0].attempts).toBe(1);
    expect(
      (
        await x.sql`select count(*)::int n from audit_logs where action='outbox.retried'`
      )[0].n,
    ).toBe(1);
  } finally {
    await x.cleanup();
  }
});
it("Lease expiry on the last attempt enters dead-letter and secret payload is rejected", async () => {
  const x = await ulujamFixture();
  try {
    const id = randomUUID();
    await expect(
      withTransaction((tx) =>
        enqueue(tx, "card.changed", id, 1, {
          cardId: id,
          phone: "+905551234567",
        }),
      ),
    ).rejects.toThrow();
    await withTransaction((tx) =>
      enqueue(tx, "card.changed", id, 1, { cardId: id }),
    );
    const [j] = await claimJobs("crash", 1);
    await x.sql`update outbox set attempts=5,lease_until=now()-interval '1 second' where id=${j.id}`;
    expect(await claimJobs("replacement", 1)).toHaveLength(0);
    expect(
      (
        await x.sql`select status,last_error_code from outbox where id=${j.id}`
      )[0],
    ).toMatchObject({ status: "dead", last_error_code: "LEASE_EXPIRED" });
  } finally {
    await x.cleanup();
  }
});
