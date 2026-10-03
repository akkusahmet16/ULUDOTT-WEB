import { it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";
import {
  approveRoster,
  approveSolo,
  rejectTeam,
} from "../../src/modules/teams/application/approval-service";
import {
  requestWalletPass,
  assertWalletEligible,
  getWalletStatus,
  syncPassRevision,
  reconcileWalletBatch,
} from "../../src/modules/wallet/application/wallet-service";
import { processBatch } from "../../src/worker/handlers";
import { handleWalletStatus } from "../../src/modules/wallet/application/wallet-http";
import { issueCsrf, CSRF_COOKIE } from "../../src/lib/auth/csrf";

function api(token: string) {
  const csrf = issueCsrf();
  return new Request(new URL("/api/wallet/status", process.env.APP_URL!), {
    method: "POST",
    headers: {
      origin: new URL(process.env.APP_URL!).origin,
      "content-type": "application/json",
      "x-csrf-token": csrf,
      cookie: CSRF_COOKIE + "=" + csrf,
    },
    body: JSON.stringify({
      cardToken: token,
      provider: "google",
      action: "request",
    }),
  });
}
// Catches UI-only eligibility and accepting team tokens as individual card credentials.
it("Wallet API denies pending/seeking/rejected and other credentials; solo approval is eligible", async () => {
  const x = await ulujamFixture();
  try {
    const s = await submitUlujam(x.input("solo"), randomUUID());
    expect((await handleWalletStatus(api(s.card!.token))).status).toBe(403);
    await expect(requestWalletPass(s.card!.token, "apple")).rejects.toThrow();
    const seeking = await submitUlujam(x.input("seeking"), randomUUID());
    await expect(
      requestWalletPass(seeking.card!.token, "google"),
    ).rejects.toThrow();
    const [a] =
      await x.sql`select id from applications where submission_id=${s.id}`;
    await approveSolo(x.actor, a.id, 1);
    expect((await assertWalletEligible(a.id, "google")).cardId).toBe(
      s.card!.id,
    );
    expect((await handleWalletStatus(api(s.card!.token))).status).toBe(200);
    await expect(requestWalletPass("z".repeat(43), "google")).rejects.toThrow();
    await x.sql`update applications set status='rejected' where id=${a.id}`;
    expect((await handleWalletStatus(api(s.card!.token))).status).toBe(403);
    expect((await getWalletStatus(s.card!.token)).eligibility).toBe("revoked");
  } finally {
    await x.cleanup();
  }
});
it("Late team member waits, owner pass is unique, token cannot select a different participant", async () => {
  const x = await ulujamFixture();
  try {
    const owner = await submitUlujam(x.input("new"), randomUUID()),
      team = owner.team!;
    await approveRoster(x.actor, team.id, 2);
    const late = await submitUlujam(
      { ...x.input("existing"), teamId: team.id, password: team.password },
      randomUUID(),
    );
    await expect(
      requestWalletPass(late.card!.token, "google"),
    ).rejects.toThrow();
    await expect(requestWalletPass(team.token, "google")).rejects.toThrow();
    const results = await Promise.all([
      requestWalletPass(owner.card!.token, "google"),
      requestWalletPass(owner.card!.token, "google"),
    ]);
    expect(results[0].status).toBe("pending");
    await requestWalletPass(owner.card!.token, "apple");
    expect((await x.sql`select count(*)::int n from wallet_passes`)[0].n).toBe(
      2,
    );
    expect((await getWalletStatus(owner.card!.token)).eligibility).toBe(
      "active",
    );
    const req = api(owner.card!.token);
    const d = await req.json();
    d.participantId = late.id;
    const altered = new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify(d),
    });
    expect((await handleWalletStatus(altered)).status).toBe(400);
    const [t] =
      await x.sql`select roster_revision from teams where id=${team.id}`;
    await rejectTeam(x.actor, team.id, "DEMO", t.roster_revision);
    await processBatch("wallet", 50);
    expect(
      (await x.sql`select distinct status from wallet_passes`).map(
        (r) => r.status,
      ),
    ).toEqual(["revoked"]);
  } finally {
    await x.cleanup();
  }
});
it("Current revision wins over stale sync and provider readiness is explicit", async () => {
  const x = await ulujamFixture();
  try {
    const r = await submitUlujam(x.input("solo"), randomUUID());
    const [a] =
      await x.sql`select id from applications where submission_id=${r.id}`;
    await approveSolo(x.actor, a.id, 1);
    await requestWalletPass(r.card!.token, "google");
    await x.sql`update cards set revision=7 where id=${r.card!.id}`;
    await syncPassRevision(a.id, 1);
    await syncPassRevision(a.id, 1);
    expect(
      (
        await x.sql`select revision,synced_revision,status from wallet_passes`
      )[0],
    ).toMatchObject({ revision: 7, synced_revision: 0, status: "pending" });
    const status = await getWalletStatus(r.card!.token);
    expect(status.providers.google.readiness).toBe("unconfigured");
    expect(status.providers.apple.readiness).toBe("unconfigured");
    expect(JSON.stringify(status)).not.toContain(r.card!.token);
  } finally {
    await x.cleanup();
  }
});

it("Retention/event close revokes a pass even without a new outbox job", async () => {
  const x = await ulujamFixture();
  try {
    const r = await submitUlujam(x.input("solo"), randomUUID());
    const [a] =
      await x.sql`select id from applications where submission_id=${r.id}`;
    await approveSolo(x.actor, a.id, 1);
    await requestWalletPass(r.card!.token, "google");
    await processBatch("wallet", 50);
    await x.sql`update events set status='archived' where id=${x.eventId}`;
    await reconcileWalletBatch();
    expect((await x.sql`select status from wallet_passes`)[0].status).toBe(
      "revoked",
    );
  } finally {
    await x.cleanup();
  }
});
