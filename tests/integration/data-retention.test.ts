import { approveRoster } from "../../src/modules/teams/application/approval-service";
import { changeSubmissionStatus } from "../../src/modules/forms/application/submission-admin";
import { randomUUID } from "node:crypto";
import { expect, it, vi } from "vitest";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";
import { ulujamFields as f } from "../../src/modules/applications/domain/ulujam-input";
import {
  exportPersonData,
  correctPersonData,
  recordConsent,
  verifyRequesterByAdmin,
} from "../../src/modules/applications/application/data-rights-service";
import { deleteOrAnonymizeExpired } from "../../src/worker/retention";

it("Rights export is event-scoped, strips all capabilities and audits access without person data", async () => {
  const x = await ulujamFixture();
  try {
    const receipt = await submitUlujam(x.input(), randomUUID());
    for (const actor of [
      { ...x.actor, eventScopes: [] },
      { ...x.actor, roles: ["content_editor"] },
      { ...x.actor, roles: ["system_admin"] },
    ])
      await expect(exportPersonData(actor, receipt.id)).rejects.toThrow(
        "Yetki",
      );
    await expect(
      exportPersonData({ verified: true } as never, receipt.id),
    ).rejects.toThrow();
    const data = await exportPersonData(x.actor, receipt.id);
    expect(data.application?.fullName).toBe("DEMO kişi");
    const json = JSON.stringify(data);
    for (const key of [
      "tokenHash",
      "tokenEncrypted",
      "receiptToken",
      "passwordHash",
      "checkinToken",
      "authToken",
      "privateKey",
    ])
      expect(json).not.toContain(key);
    const log = JSON.stringify(
      await x.sql`select changes from audit_logs where action='privacy.exported'`,
    );
    expect(log).not.toContain("DEMO kişi");
    expect(log).not.toContain("test.invalid");
  } finally {
    await x.cleanup();
  }
});
it("Correction commits submitted answers, application and card invalidation atomically; stale revision is rejected", async () => {
  const x = await ulujamFixture();
  try {
    const input = x.input(),
      receipt = await submitUlujam(input, randomUUID());
    await correctPersonData(x.actor, receipt.id, {
      expectedRevision: 1,
      answers: {
        ...input.answers,
        [f.fullName]: "DEMO düzeltilen",
        [f.email]: "corrected@test.invalid",
      },
    });
    expect(
      (await x.sql`select full_name,email,revision from applications`)[0],
    ).toMatchObject({
      full_name: "DEMO düzeltilen",
      email: "corrected@test.invalid",
      revision: 2,
    });
    expect((await x.sql`select revision from cards`)[0].revision).toBe(2);
    await expect(
      correctPersonData(x.actor, receipt.id, {
        expectedRevision: 1,
        answers: input.answers,
      }),
    ).rejects.toThrow("Sürüm");
    expect(
      (await exportPersonData(x.actor, receipt.id)).answers[f.fullName],
    ).toBe("DEMO düzeltilen");
  } finally {
    await x.cleanup();
  }
});
it("Verified requester grant is server-minted, short-lived and bound to one person", async () => {
  const x = await ulujamFixture();
  try {
    const receipt = await submitUlujam(x.input(), randomUUID()),
      other = await submitUlujam(x.input(), randomUUID());
    await x.sql`insert into admin_roles(admin_id,role) values(${x.actor.adminId},'event_manager')`;
    await x.sql`insert into admin_event_scopes(admin_id,event_id) values(${x.actor.adminId},${x.eventId})`;
    const proof = await verifyRequesterByAdmin(x.actor, receipt.id, {
      method: "existing_contact_challenge",
      referenceId: randomUUID(),
    });
    expect((await exportPersonData(proof, receipt.id)).id).toBe(receipt.id);
    await expect(exportPersonData(proof, other.id)).rejects.toThrow(
      "Doğrulama",
    );
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 301000);
    await expect(exportPersonData(proof, receipt.id)).rejects.toThrow(
      "Doğrulama",
    );
  } finally {
    vi.restoreAllMocks();
    await x.cleanup();
  }
});
it("Retention removes expired answers/replay/consent, revokes cards and clears linked PII; unexpired person stays untouched", async () => {
  const x = await ulujamFixture();
  try {
    const expired = await submitUlujam(x.input("new"), randomUUID()),
      live = await submitUlujam(x.input(), randomUUID());
    const [a] =
      await x.sql`select id from applications where submission_id=${expired.id}`;
    const [c] = await x.sql`select id from cards where application_id=${a.id}`;
    await x.sql`insert into wallet_passes(card_id,provider,object_id,status,provider_state,synced_revision) values(${c.id},'google','synthetic.object','ready','active',1)`;
    await x.sql`update submissions set created_at=now()-interval '3 days',expires_at=now()-interval '1 day' where id=${expired.id}`;
    const result = await deleteOrAnonymizeExpired(new Date());
    expect(result).toMatchObject({
      deleted: 1,
      anonymized: 1,
      pendingRevocations: 1,
    });
    expect(
      (
        await x.sql`select count(*)::int n from submissions where id=${expired.id}`
      )[0].n,
    ).toBe(0);
    expect(
      (
        await x.sql`select count(*)::int n from idempotency_records where resource_id=${expired.id}`
      )[0].n,
    ).toBe(0);
    expect(
      (
        await x.sql`select full_name,email,phone,submission_id,token_hash from applications where id=${a.id}`
      )[0],
    ).toMatchObject({
      full_name: "Silinen katılımcı",
      phone: "+10000000000",
      submission_id: null,
      token_hash: null,
    });
    expect(
      (
        await x.sql`select status,checkin_token_encrypted from cards where id=${c.id}`
      )[0],
    ).toMatchObject({ status: "revoked", checkin_token_encrypted: null });
    expect(
      (
        await x.sql`select count(*)::int n from memberships where application_id=${a.id}`
      )[0].n,
    ).toBe(0);
    expect(
      (await exportPersonData(x.actor, live.id)).application?.fullName,
    ).toBe("DEMO kişi");
    expect(
      JSON.stringify(await x.sql`select * from retention_runs`),
    ).not.toContain("DEMO kişi");
    expect(await deleteOrAnonymizeExpired(new Date())).toMatchObject({
      deleted: 0,
      anonymized: 0,
    });
  } finally {
    await x.cleanup();
  }
});
it("Consent cannot be invented without a persisted affirmative answer and matching published version", async () => {
  const x = await ulujamFixture();
  try {
    const receipt = await submitUlujam(x.input(), randomUUID());
    await expect(
      recordConsent("fictional-version", "marketing", receipt.id, new Date()),
    ).rejects.toThrow("Rıza");
  } finally {
    await x.cleanup();
  }
});

import {
  saveDraftForm,
  publishForm,
} from "../../src/modules/forms/application/form-service";
import { buildUlujamFormDefinition } from "../../src/modules/applications/domain/ulujam-input";
it("Persisted consent preserves original version/time and cannot be renewed after withdrawal", async () => {
  const x = await ulujamFixture();
  try {
    const field = randomUUID(),
      definition = buildUlujamFormDefinition(x.eventId);
    definition.fields.push({
      id: field,
      type: "consent",
      label: "DEMO test rızası",
      content: "Yalnız sentetik test metni",
      required: false,
      consentVersion: "demo-v1",
      purpose: "participation",
    });
    await saveDraftForm(x.actor, x.form.id, definition, 3);
    await publishForm(x.actor, x.form.id, 4);
    const [v] =
      await x.sql`select current_version_id from forms where id=${x.form.id}`;
    const input = x.input("solo", randomUUID() + "@test.invalid", {
      [field]: true,
    });
    input.versionId = v.current_version_id;
    const receipt = await submitUlujam(input, randomUUID());
    const [original] =
      await x.sql`select granted_at,text_version from consents where submission_id=${receipt.id}`;
    expect(
      (await recordConsent("demo-v1", "participation", receipt.id, new Date()))
        .at,
    ).toEqual(original.granted_at);
    await expect(
      correctPersonData(x.actor, receipt.id, {
        expectedRevision: 1,
        answers: { ...input.answers, [field]: false },
      }),
    ).rejects.toThrow("Rıza");
    await changeSubmissionStatus(x.actor, receipt.id, "withdrawn", 1);
    await expect(
      recordConsent("demo-v1", "participation", receipt.id, new Date()),
    ).rejects.toThrow("Rıza");
  } finally {
    await x.cleanup();
  }
});

it.each([
  [true, false],
  [false, false],
  [true, true],
])(
  "Retention preserves remaining approved members (historical=%s game=%s)",
  async (historical, game) => {
    const x = await ulujamFixture();
    try {
      const old = await submitUlujam(x.input("new"), randomUUID());
      const current = await submitUlujam(x.input("seeking"), randomUUID());
      const [currentApp] =
        await x.sql`select id from applications where submission_id=${current.id}`;
      await x.sql`insert into memberships(team_id,application_id,event_id) values(${old.team!.id},${currentApp.id},${x.eventId})`;
      await approveRoster(x.actor, old.team!.id, 2);
      const [a] =
        await x.sql`select id from applications where submission_id=${old.id}`;
      const [currentCard] =
        await x.sql`select c.id,c.status,c.revision from cards c join applications a on a.id=c.application_id where a.submission_id=${current.id}`;
      if (historical)
        await x.sql`update memberships set left_at=now() where application_id=${a.id}`;
      if (game) {
        const gid = randomUUID();
        await x.sql`insert into games(id,event_id,team_id,itch_url,published_at) values(${gid},${x.eventId},${old.team!.id},'https://demo.itch.io/game',now())`;
        await x.sql`insert into game_credits(game_id,application_id,publication_name,consented_at) values(${gid},${a.id},'DEMO yapımcı',now())`;
      }
      const [before] =
        await x.sql`select roster_revision from teams where id=${old.team!.id}`;
      await x.sql`update submissions set created_at=now()-interval '3 days',expires_at=now()-interval '1 day' where id=${old.id}`;
      await deleteOrAnonymizeExpired(new Date());
      const [team] =
        await x.sql`select status,roster_revision from teams where id=${old.team!.id}`;
      expect(team.status).toBe("approved");
      expect(team.roster_revision).toBe(
        before.roster_revision + (historical ? 0 : 1),
      );
      const [after] =
        await x.sql`select status,revision from cards where id=${currentCard.id}`;
      expect(after.status).toBe("active");
      expect(after.revision).toBe(
        currentCard.revision + (historical ? 0 : 1) + (game ? 1 : 0),
      );
    } finally {
      await x.cleanup();
    }
  },
);
