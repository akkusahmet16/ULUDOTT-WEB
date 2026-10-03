import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";
import { approveSolo } from "../../src/modules/teams/application/approval-service";
import { processBatch } from "../../src/worker/handlers";
import { enqueue } from "../../src/lib/queue/outbox";
import { withTransaction } from "../../src/lib/database/transaction";

it("Worker-off submission remains consistent; delayed/replayed jobs read the newest revision", async () => {
  const x = await ulujamFixture();
  try {
    const receipt = await submitUlujam(x.input("solo"), randomUUID());
    const [a] =
      await x.sql`select id from applications where submission_id=${receipt.id}`;
    expect((await x.sql`select status from cards`)[0].status).toBe("pending");
    await approveSolo(x.actor, a.id, 1);
    expect((await x.sql`select status,revision from cards`)[0]).toMatchObject({
      status: "active",
      revision: 2,
    });
    await promisify(execFile)(
      process.execPath,
      ["--conditions=react-server", "src/worker/main.ts", "--once"],
      { env: process.env, timeout: 20000 },
    );
    expect(
      (
        await x.sql`select count(*)::int n from outbox where status!='completed'`
      )[0].n,
    ).toBe(0);
    await x.sql`update outbox set status='pending',attempts=0,available_at=now()`;
    await processBatch("test", 20);
    expect((await x.sql`select status,revision from cards`)[0]).toMatchObject({
      status: "active",
      revision: 2,
    });
    await x.sql`update applications set status='withdrawn' where id=${a.id}`;
    await x.sql`update cards set revision=3,status='revoked' where application_id=${a.id}`;
    await x.sql`update outbox set status='pending',attempts=0,available_at=now()`;
    await processBatch("test", 20);
    expect((await x.sql`select status,revision from cards`)[0]).toMatchObject({
      status: "revoked",
      revision: 3,
    });
  } finally {
    await x.cleanup();
  }
});
it("Unknown handler fails safely instead of silently completing", async () => {
  const x = await ulujamFixture();
  try {
    const id = randomUUID();
    await withTransaction((tx) =>
      enqueue(tx, "unknown.changed", id, 1, { cardId: id }),
    );
    await processBatch("test", 1);
    expect(
      (await x.sql`select status,last_error_code from outbox`)[0],
    ).toMatchObject({ status: "pending", last_error_code: "UNKNOWN_JOB" });
  } finally {
    await x.cleanup();
  }
});
