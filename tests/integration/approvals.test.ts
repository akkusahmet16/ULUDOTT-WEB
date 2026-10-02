import { it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";
import {
  approveRoster,
  requestRosterChanges,
  rejectTeam,
  approveSolo,
  decideSolo,
  listApprovals,
} from "../../src/modules/teams/application/approval-service";
import { cardEligibility } from "../../src/modules/cards/domain/card-eligibility";
it("Yetki, eski revision, immutable kadro kararı, geç üye ve gerekçeli geçişler", async () => {
  const x = await ulujamFixture();
  try {
    const founder = await submitUlujam(x.input("new"), randomUUID());
    if (!founder.team?.password) throw Error("missing team");
    const team = founder.team;
    const [a] =
      await x.sql`select id from applications where submission_id=${founder.id}`;
    await expect(
      approveRoster({ ...x.actor, eventScopes: [] }, team.id, 2),
    ).rejects.toThrow("Yetki yok");
    const approved = await approveRoster(x.actor, team.id, 2);
    expect(approved.revision).toBe(3);
    await expect(approveRoster(x.actor, team.id, 2)).rejects.toThrow(
      "Sürüm çakışması",
    );
    expect((await x.sql`select status,revision from cards`)[0]).toMatchObject({
      status: "active",
      revision: 2,
    });
    const late = await submitUlujam(
      { ...x.input("existing"), teamId: team.id, password: team.password },
      randomUUID(),
    );
    const queue = await listApprovals(x.actor, x.eventId);
    const row = queue.teams.find((t) => t.id === team.id)!;
    expect(row.memberCount).toBe(2);
    expect(row.members.map((m) => m.cardStatus)).toEqual(
      expect.arrayContaining(["active", "pending"]),
    );
    expect(
      cardEligibility(
        { status: "pending", mode: "existing" },
        { status: "approved", memberApproved: true },
      ),
    ).toBe("active");
    await requestRosterChanges(
      x.actor,
      team.id,
      "DEMO eksik bilgi",
      row.revision,
    );
    expect(
      (
        await x.sql`select status from team_approvals where team_id=${team.id} and revision=3`
      )[0].status,
    ).toBe("approved");
    expect(
      (await x.sql`select status from cards where application_id=${a.id}`)[0]
        .status,
    ).toBe("active");
    const [current] =
      await x.sql`select roster_revision from teams where id=${team.id}`;
    await approveRoster(x.actor, team.id, current.roster_revision);
    const [lateMember] =
      await x.sql`select m.approved_revision from memberships m join applications a on a.id=m.application_id where a.submission_id=${late.id}`;
    expect(lateMember.approved_revision).not.toBeNull();
    const [t] =
      await x.sql`select roster_revision from teams where id=${team.id}`;
    await expect(
      rejectTeam(x.actor, team.id, "", t.roster_revision),
    ).rejects.toThrow();
    await rejectTeam(x.actor, team.id, "DEMO gerekçe", t.roster_revision);
    expect((await x.sql`select status from cards`)[0].status).toBe("revoked");
    expect(
      (
        await x.sql`select count(*)::int n from outbox where type='card.changed'`
      )[0].n,
    ).toBeGreaterThan(0);
  } finally {
    await x.cleanup();
  }
});
it("Solo için sahte takım yok, onay kapsam ve retention kontrolü korunur", async () => {
  const x = await ulujamFixture();
  try {
    const receipt = await submitUlujam(x.input("solo"), randomUUID());
    const [a] =
      await x.sql`select id from applications where submission_id=${receipt.id}`;
    await approveSolo(x.actor, a.id, 1);
    expect(
      (await x.sql`select status from applications where id=${a.id}`)[0].status,
    ).toBe("approved");
    await decideSolo(
      x.actor,
      a.id,
      "changes_requested",
      "DEMO bireysel gerekçe",
      2,
    );
    expect(
      (await listApprovals(x.actor, x.eventId)).solos.find(
        (s) => s.id === a.id,
      ),
    ).toMatchObject({ note: "DEMO bireysel gerekçe" });
    expect((await x.sql`select count(*)::int n from teams`)[0].n).toBe(0);
    await expect(approveSolo(x.actor, a.id, 1)).rejects.toThrow(
      "Sürüm çakışması",
    );
    const expired = await submitUlujam(x.input("solo"), randomUUID());
    const [b] =
      await x.sql`select id from applications where submission_id=${expired.id}`;
    await x.sql`update submissions set created_at=now()-interval '3 days',expires_at=now()-interval '1 day' where id=${expired.id}`;
    await expect(approveSolo(x.actor, b.id, 1)).rejects.toThrow(/saklama/);
  } finally {
    await x.cleanup();
  }
});
