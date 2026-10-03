import { requestWalletPass } from "../../src/modules/wallet/application/wallet-service";
import {
  saveGameDraft,
  publishGame,
  getGameEditor,
  assignAward,
  unpublishGame,
} from "../../src/modules/games/application/game-service";
import { approvePublicationName } from "../../src/modules/games/application/credit-consent-service";
import { processBatch } from "../../src/worker/handlers";
import { it, expect } from "vitest";
import { randomUUID, verify } from "node:crypto";
import { googleProtocol } from "../helpers/google-protocol";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";
import {
  approveSolo,
  approveRoster,
} from "../../src/modules/teams/application/approval-service";
import { rotateCheckIn } from "../../src/modules/cards/application/check-in-service";
import { GoogleWalletAdapter } from "../../src/modules/wallet/google/google-adapter";
import { loadGoogleConfig } from "../../src/lib/config/wallet";
import { requestGooglePass } from "../../src/modules/wallet/application/google-service";
import {
  syncPassRevision,
  reconcileWalletBatch,
} from "../../src/modules/wallet/application/wallet-service";
import { handleGoogleWallet } from "../../src/modules/wallet/application/google-http";
import { issueCsrf, CSRF_COOKIE } from "../../src/lib/auth/csrf";

const card = {
  id: "15000000-0000-4000-8000-000000000123",
  eventId: "15000000-0000-4000-8000-000000000124",
  revision: 7,
  name: "DEMO kişi",
  eventTitle: "DEMO UluJam",
  teamName: "DEMO takım",
  checkinToken: "q".repeat(43),
  status: "active" as const,
  rank: 1,
  finalist: true,
};
it("RSA OAuth/save signatures, stable object, 409 update and ID-only save JWT", async () => {
  const p = await googleProtocol();
  try {
    const adapter = new GoogleWalletAdapter({
      ...loadGoogleConfig(),
      appOrigin: "https://uludott.test",
    });
    await adapter.ensureClass(card.eventId);
    await adapter.upsertPass(card, 7);
    await adapter.upsertPass({ ...card, rank: 2 }, 7);
    const id = "123456789.uludott_15000000000040008000000000000123";
    expect(p.objects.size).toBe(1);
    expect(p.objects.get(id)).toMatchObject({
      id,
      state: "ACTIVE",
      barcode: { type: "QR_CODE", value: "uludott:check-in:" + "q".repeat(43) },
    });
    expect(p.objects.get(id)?.textModulesData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "award", body: "2. sıra" }),
      ]),
    );
    expect(p.oauthValid()).toBe(true);
    const link = adapter.createSaveLink(card, "https://uludott.test"),
      jwt = link.split("/").at(-1)!.split(".");
    expect(
      verify(
        "RSA-SHA256",
        Buffer.from(jwt.slice(0, 2).join(".")),
        p.pair.publicKey,
        Buffer.from(jwt[2], "base64url"),
      ),
    ).toBe(true);
    const claims = JSON.parse(Buffer.from(jwt[1], "base64url").toString());
    expect(claims).toMatchObject({
      aud: "google",
      typ: "savetowallet",
      origins: ["uludott.test"],
      payload: { genericObjects: [{ id }] },
    });
    expect(JSON.stringify(claims)).not.toContain("DEMO kişi");
    expect(JSON.stringify(claims)).not.toContain(card.checkinToken);
    expect(link).not.toContain(p.key);
    await expect(adapter.upsertPass(card, 6)).rejects.toThrow("STALE_REVISION");
    expect(() =>
      adapter.createSaveLink(card, "https://wrong-origin.test/path"),
    ).toThrow();
    await adapter.deactivatePass(id);
    expect(p.objects.get(id)?.state).toBe("INACTIVE");
  } finally {
    await p.cleanup();
  }
});
it("404/403 provider responses are failures, never a ready pass", async () => {
  const p = await googleProtocol();
  try {
    const a = new GoogleWalletAdapter(loadGoogleConfig());
    await expect(a.deactivatePass("123456789.missing")).rejects.toThrow(
      "GOOGLE_HTTP_404",
    );
    p.setFailure(403);
    await expect(a.upsertPass(card, 7)).rejects.toThrow("GOOGLE_HTTP_403");
    p.setFailure(404);
    await expect(a.ensureClass(card.eventId)).rejects.toThrow(
      "GOOGLE_HTTP_404",
    );
  } finally {
    await p.cleanup();
  }
});
it("Server gate, provider failure persistence, stable update/check-in rotation and revocation", async () => {
  const x = await ulujamFixture(),
    p = await googleProtocol();
  try {
    const r = await submitUlujam(x.input("solo"), randomUUID()),
      [a] =
        await x.sql`select id from applications where submission_id=${r.id}`;
    await expect(requestGooglePass(r.card!.token)).rejects.toThrow();
    expect(p.objects.size).toBe(0);
    expect((await x.sql`select count(*)::int n from wallet_passes`)[0].n).toBe(
      0,
    );
    const csrf = issueCsrf(),
      req = new Request(
        new URL("/api/wallet/google/" + r.card!.token, process.env.APP_URL!),
        {
          method: "POST",
          headers: {
            origin: new URL(process.env.APP_URL!).origin,
            "x-csrf-token": csrf,
            cookie: CSRF_COOKIE + "=" + csrf,
          },
        },
      );
    expect((await handleGoogleWallet(req, r.card!.token)).status).toBe(403);
    await approveSolo(x.actor, a.id, 1);
    p.setFailure(404);
    await expect(requestGooglePass(r.card!.token)).rejects.toThrow();
    expect(
      (await x.sql`select status,last_error_code from wallet_passes`)[0],
    ).toMatchObject({ status: "failed", last_error_code: "GOOGLE_HTTP_404" });
    p.setFailure(null);
    const first = await requestGooglePass(r.card!.token);
    expect(first.url).toMatch(/^https:\/\/pay.google.com\/gp\/v\/save\//);
    const [pass] =
      await x.sql`select object_id,revision,synced_revision,status,provider_state from wallet_passes`;
    expect(pass).toMatchObject({
      revision: 2,
      synced_revision: 2,
      status: "ready",
      provider_state: "active",
    });
    const oldBarcode = p.objects.get(pass.object_id)?.barcode;
    await rotateCheckIn(x.actor, r.card!.id, 2);
    await syncPassRevision(a.id, 1);
    expect(p.objects.size).toBe(1);
    expect(p.objects.get(pass.object_id)?.barcode).not.toEqual(oldBarcode);
    expect(
      (await x.sql`select revision,synced_revision from wallet_passes`)[0],
    ).toMatchObject({ revision: 3, synced_revision: 3 });
    await x.sql`update applications set status='withdrawn' where id=${a.id}`;
    await x.sql`update cards set revision=4,status='revoked' where id=${r.card!.id}`;
    await syncPassRevision(a.id, 1);
    expect(p.objects.get(pass.object_id)?.state).toBe("INACTIVE");
    await expect(requestGooglePass(r.card!.token)).rejects.toThrow();
    expect(
      (
        await x.sql`select status,provider_state,synced_revision from wallet_passes`
      )[0],
    ).toMatchObject({
      status: "revoked",
      provider_state: "revoked",
      synced_revision: 4,
    });
    expect(
      JSON.stringify(await x.sql`select payload from outbox`),
    ).not.toContain(r.card!.token);
  } finally {
    await p.cleanup();
    await x.cleanup();
  }
});

it("Reconciliation preserves queue backoff and does not directly hammer a failed provider", async () => {
  const x = await ulujamFixture(),
    p = await googleProtocol();
  try {
    const r = await submitUlujam(x.input("solo"), randomUUID());
    const [a] =
      await x.sql`select id from applications where submission_id=${r.id}`;
    await approveSolo(x.actor, a.id, 1);
    p.setFailure(503);
    await expect(requestGooglePass(r.card!.token)).rejects.toThrow();
    const before = p.requests();
    for (let n = 0; n < 3; n++) await reconcileWalletBatch();
    expect(p.requests()).toBe(before);
  } finally {
    await p.cleanup();
    await x.cleanup();
  }
});

it("Published degree changes reach the same provider object; old jobs cannot restore a withdrawn award", async () => {
  const x = await ulujamFixture(),
    p = await googleProtocol();
  try {
    const r = await submitUlujam(x.input("new"), randomUUID());
    await approveRoster(x.actor, r.team!.id, 2);
    const [a] =
      await x.sql`select id from applications where submission_id=${r.id}`;
    const g = await saveGameDraft(x.actor, x.eventId, {
      title: "DEMO Wallet oyun",
      slug: "demo-wallet-game",
      description: "DEMO",
      teamId: r.team!.id,
      mediaId: null,
      itchUrl: "https://demo.itch.io/game",
      credits: [{ applicationId: a.id, publicationName: "DEMO yapımcı" }],
    });
    const edit = await getGameEditor(x.actor, g.id);
    await approvePublicationName(edit.credits[0].token!, "DEMO yapımcı", true);
    await publishGame(
      x.actor,
      g.id,
      (await getGameEditor(x.actor, g.id)).revision,
    );
    await assignAward(x.actor, x.eventId, 1, g.id);
    await requestGooglePass(r.card!.token);
    const [pass] = await x.sql`select object_id from wallet_passes`;
    expect(p.objects.get(pass.object_id)?.textModulesData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "award", body: "1. sıra" }),
      ]),
    );
    await assignAward(x.actor, x.eventId, 2, g.id);
    await processBatch("degree", 50);
    expect(p.objects.size).toBe(1);
    expect(p.objects.get(pass.object_id)?.textModulesData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "award", body: "2. sıra" }),
      ]),
    );
    await unpublishGame(
      x.actor,
      g.id,
      (await getGameEditor(x.actor, g.id)).revision,
    );
    await x.sql`update outbox set status='pending',attempts=0,available_at=now()`;
    await processBatch("degree", 50);
    expect(p.objects.get(pass.object_id)?.textModulesData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "award", body: "Katılımcı" }),
      ]),
    );
  } finally {
    await p.cleanup();
    await x.cleanup();
  }
});

it("Slow first provider job does not consume the unstarted jobs leases", async () => {
  const x = await ulujamFixture(),
    p = await googleProtocol();
  try {
    const first = await submitUlujam(x.input("solo"), randomUUID()),
      second = await submitUlujam(x.input("solo"), randomUUID());
    for (const r of [first, second]) {
      const [a] =
        await x.sql`select id from applications where submission_id=${r.id}`;
      await approveSolo(x.actor, a.id, 1);
      await requestWalletPass(r.card!.token, "google");
    }
    let once = false;
    p.beforeRequest(async () => {
      if (once) return;
      once = true;
      await x.sql`update outbox set lease_until=now()-interval '1 second' where status='processing' and aggregate_id!=${first.card!.id}`;
    });
    await processBatch("slow", 50);
    expect(p.objects.size).toBe(2);
    expect(
      (
        await x.sql`select count(*)::int n from outbox where status!='completed'`
      )[0].n,
    ).toBe(0);
  } finally {
    await p.cleanup();
    await x.cleanup();
  }
});
