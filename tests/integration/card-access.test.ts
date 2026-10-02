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
  getOwnCard,
  getTeamCardSummaries,
  requireActiveCard,
} from "../../src/modules/cards/application/card-service";
import {
  loginTeam,
  requireTeamSession,
  TEAM_COOKIE,
  rotateTeamAccess,
} from "../../src/modules/teams/application/team-access";
it("Bireysel pending/active/revoked, geç üye ve takım token izolasyonu", async () => {
  const x = await ulujamFixture();
  try {
    const key = randomUUID(),
      first = await submitUlujam(x.input("new"), key);
    expect(first.card).toBeDefined();
    expect((await getOwnCard(first.card!.token)).status).toBe("pending");
    await expect(requireActiveCard(first.card!.token)).rejects.toThrow();
    const team = first.team!;
    await approveRoster(x.actor, team.id, 2);
    const active = await getOwnCard(first.card!.token);
    expect(active.status).toBe("active");
    expect(active.qr).toMatch(/^data:image\/png/);
    const late = await submitUlujam(
      { ...x.input("existing"), teamId: team.id, password: team.password },
      randomUUID(),
    );
    expect((await getOwnCard(late.card!.token)).status).toBe("pending");
    expect((await getOwnCard(first.card!.token)).status).toBe("active");
    const login = await loginTeam(team.token, team.password!);
    const session = await requireTeamSession(
      new Request("https://private.invalid", {
        headers: { cookie: TEAM_COOKIE + "=" + login.token },
      }),
      team.id,
    );
    const summaries = await getTeamCardSummaries(session);
    expect(summaries).toHaveLength(2);
    expect(Object.keys(summaries[0]).sort()).toEqual(["name", "status"]);
    expect(JSON.stringify(summaries)).not.toContain(first.card!.token);
    expect(JSON.stringify(summaries)).not.toContain("@test.invalid");
    await rotateTeamAccess(x.actor, team.id);
    await expect(getTeamCardSummaries(session)).rejects.toThrow();
    const [t] =
      await x.sql`select roster_revision from teams where id=${team.id}`;
    await rejectTeam(x.actor, team.id, "DEMO", t.roster_revision);
    expect((await getOwnCard(first.card!.token)).status).toBe("revoked");
    expect((await getOwnCard(first.card!.token)).qr).toBeNull();
  } finally {
    await x.cleanup();
  }
});
it("Solo onay, seeking bekler, retention/iptal ve idempotent kart makbuzu", async () => {
  const x = await ulujamFixture();
  try {
    const input = x.input("solo"),
      key = randomUUID(),
      r = await submitUlujam(input, key);
    expect((await submitUlujam(input, key)).card).toEqual(r.card);
    const [a] =
      await x.sql`select id from applications where submission_id=${r.id}`;
    await approveSolo(x.actor, a.id, 1);
    expect((await getOwnCard(r.card!.token)).status).toBe("active");
    const s = await submitUlujam(x.input("seeking"), randomUUID());
    expect((await getOwnCard(s.card!.token)).status).toBe("pending");
    await x.sql`update events set status='cancelled' where id=${x.eventId}`;
    expect((await getOwnCard(r.card!.token)).status).toBe("revoked");
    await x.sql`update submissions set created_at=now()-interval '3 days',expires_at=now()-interval '1 day' where id=${r.id}`;
    await expect(getOwnCard(r.card!.token)).rejects.toThrow(/saklama/);
    expect((await x.sql`select count(*)::int n from wallet_passes`)[0].n).toBe(
      0,
    );
  } finally {
    await x.cleanup();
  }
});
