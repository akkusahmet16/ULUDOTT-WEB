import { it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";
import {
  assignParticipant,
  unassignParticipant,
  seekerBoard,
} from "../../src/modules/matching/application/matching-service";
it("Alan/seviye/kapsam, öneri salt okuma; son koltuk yarışı, atama/geri alma ve audit", async () => {
  const x = await ulujamFixture();
  try {
    const founder = await submitUlujam(x.input("new"), randomUUID());
    if (!founder.team) throw Error("team missing");
    const team = founder.team;
    await submitUlujam(x.input("seeking"), randomUUID());
    await submitUlujam(x.input("seeking"), randomUUID());
    const seekers =
      await x.sql`select id from applications where mode='seeking' order by id`;
    const before = (await x.sql`select count(*)::int n from memberships`)[0].n;
    const board = await seekerBoard(x.actor, {
      eventId: x.eventId,
      skill: "software",
      minLevel: 3,
    });
    expect(board.items).toHaveLength(2);
    expect(board.items[0].recommendations).toHaveLength(1);
    expect(
      (
        await seekerBoard(x.actor, {
          eventId: x.eventId,
          skill: "software",
          minLevel: 4,
        })
      ).items,
    ).toHaveLength(0);
    expect((await x.sql`select count(*)::int n from memberships`)[0].n).toBe(
      before,
    );
    await expect(
      seekerBoard({ ...x.actor, eventScopes: [] }, { eventId: x.eventId }),
    ).rejects.toThrow("Yetki yok");
    const revision = board.items[0].recommendations[0].rosterRevision;
    await expect(
      assignParticipant(
        { ...x.actor, roles: ["system_admin"] },
        seekers[0].id,
        team.id,
        revision,
      ),
    ).rejects.toThrow("Yetki yok");
    const results = await Promise.allSettled(
      seekers.map((s) => assignParticipant(x.actor, s.id, team.id, revision)),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const successful = results.find((r) => r.status === "fulfilled");
    if (successful?.status !== "fulfilled") throw Error("assignment missing");
    const assigned = successful.value;
    expect(
      (
        await x.sql`select count(*)::int n from memberships where left_at is null`
      )[0].n,
    ).toBe(2);
    expect(
      (
        await x.sql`select approved_revision from memberships where application_id=${assigned.participantId}`
      )[0].approved_revision,
    ).toBeNull();
    await expect(
      unassignParticipant(x.actor, assigned.participantId, team.id, revision),
    ).rejects.toThrow("Sürüm çakışması");
    await unassignParticipant(
      x.actor,
      assigned.participantId,
      team.id,
      assigned.rosterRevision,
    );
    expect(
      (
        await x.sql`select count(*)::int n from memberships where left_at is null`
      )[0].n,
    ).toBe(1);
    expect(
      (
        await x.sql`select action from audit_logs where action in ('matching.assigned','matching.unassigned') order by created_at`
      ).map((r) => r.action),
    ).toEqual(["matching.assigned", "matching.unassigned"]);
    expect((await x.sql`select count(*)::int n from cards`)[0].n).toBe(0);
  } finally {
    await x.cleanup();
  }
});
it("Dolu veya farklı etkinliğin takımına taşıma önceki üyeliği bozmaz", async () => {
  const x = await ulujamFixture();
  try {
    const first = await submitUlujam(x.input("new"), randomUUID());
    await submitUlujam(x.input("seeking"), randomUUID());
    if (!first.team) throw Error("missing team");
    const [person] =
      await x.sql`select id from applications where mode='seeking'`;
    const assigned = await assignParticipant(
      x.actor,
      person.id,
      first.team.id,
      2,
    );
    const second = randomUUID();
    await x.sql`insert into teams(id,event_id,name,normalized_name,expected_size,status) values(${second},${x.eventId},'DEMO kapalı','demo kapalı',1,'withdrawn')`;
    await expect(
      assignParticipant(x.actor, person.id, second, 1),
    ).rejects.toThrow(/kapalı/);
    const otherEvent = randomUUID(),
      foreign = randomUUID();
    await x.sql`insert into events(id,title,slug,kind) values(${otherEvent},'DEMO yabancı',${"foreign-" + otherEvent},'ulujam')`;
    await x.sql`insert into teams(id,event_id,name,normalized_name,expected_size) values(${foreign},${otherEvent},'DEMO yabancı','demo yabancı',2)`;
    await expect(
      assignParticipant(x.actor, person.id, foreign, 1),
    ).rejects.toThrow(/uyuşmuyor/);
    expect(
      (
        await x.sql`select team_id from memberships where application_id=${person.id} and left_at is null`
      )[0].team_id,
    ).toBe(first.team.id);
    expect(
      (
        await x.sql`select roster_revision from teams where id=${first.team.id}`
      )[0].roster_revision,
    ).toBe(assigned.rosterRevision);
  } finally {
    await x.cleanup();
  }
});
it("Liste okunduktan sonra saklama süresi dolan kişi atanamaz; süresi dolan beceriler öneriyi etkilemez", async () => {
  const x = await ulujamFixture();
  try {
    const founder = await submitUlujam(x.input("new"), randomUUID());
    if (!founder.team) throw Error("missing team");
    const seeking = await submitUlujam(x.input("seeking"), randomUUID());
    const [participant] =
      await x.sql`select id from applications where submission_id=${seeking.id}`;
    const before = await seekerBoard(x.actor, { eventId: x.eventId });
    expect(before.items).toHaveLength(1);
    await x.sql`update submissions set created_at=now()-interval '3 days',expires_at=now()-interval '1 day' where id in (${seeking.id},${founder.id})`;
    await expect(
      assignParticipant(x.actor, participant.id, founder.team.id, 2),
    ).rejects.toThrow(/saklama/);
    expect(
      (
        await x.sql`select count(*)::int n from memberships where left_at is null`
      )[0].n,
    ).toBe(1);
    await submitUlujam(x.input("seeking"), randomUUID());
    const after = await seekerBoard(x.actor, { eventId: x.eventId });
    expect(after.items).toHaveLength(1);
    expect(after.items[0].recommendations[0].skills).toEqual([]);
  } finally {
    await x.cleanup();
  }
});
it("Altı ve elli bir aday takımın her birine öneri sayfalarından erişilir", async () => {
  const x = await ulujamFixture();
  try {
    await submitUlujam(x.input("seeking"), randomUUID());
    for (let n = 0; n < 6; n++)
      await x.sql`insert into teams(event_id,name,normalized_name,expected_size) values(${x.eventId},${"DEMO " + n},${"demo " + n},2)`;
    const small = await seekerBoard(x.actor, { eventId: x.eventId });
    expect(small.items[0].recommendations).toHaveLength(6);
    expect(small.nextTeamCursor).toBeNull();
    for (let n = 6; n < 51; n++)
      await x.sql`insert into teams(event_id,name,normalized_name,expected_size) values(${x.eventId},${"DEMO " + n},${"demo " + n},2)`;
    const first = await seekerBoard(x.actor, { eventId: x.eventId });
    expect(first.items[0].recommendations).toHaveLength(50);
    expect(first.nextTeamCursor).not.toBeNull();
    const second = await seekerBoard(x.actor, {
      eventId: x.eventId,
      teamCursor: first.nextTeamCursor!,
    });
    expect(second.items[0].recommendations).toHaveLength(1);
    expect(
      new Set(
        [
          ...first.items[0].recommendations,
          ...second.items[0].recommendations,
        ].map((t) => t.id),
      ).size,
    ).toBe(51);
  } finally {
    await x.cleanup();
  }
});
