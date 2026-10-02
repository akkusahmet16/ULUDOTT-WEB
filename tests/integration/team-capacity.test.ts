import { it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";
import { ulujamFields as f } from "../../src/modules/applications/domain/ulujam-input";
import { normalizeTeamName } from "../../src/modules/teams/domain/team";
it("Türkçe/NFKC isim, yeni takım atomik rollback ve son üyelik yarışı", async () => {
  const x = await ulujamFixture();
  try {
    expect(normalizeTeamName("  ＩŞIK   EKİP ")).toBe(
      normalizeTeamName("ışık ekip"),
    );
    const founder = await submitUlujam(x.input("new"), randomUUID());
    if (!founder.team?.password) throw Error("Team receipt missing");
    const team = founder.team;
    expect(team).toMatchObject({
      password: expect.any(String),
      token: expect.any(String),
    });
    await expect(
      submitUlujam(
        x.input("new", undefined, { [f.teamName]: " demo   TAKIM " }),
        randomUUID(),
      ),
    ).rejects.toThrow();
    await expect(
      submitUlujam(
        { ...x.input("existing"), teamId: team.id, password: "wrong" },
        randomUUID(),
      ),
    ).rejects.toThrow();
    const results = await Promise.allSettled(
      [1, 2].map(() =>
        submitUlujam(
          {
            ...x.input("existing"),
            teamId: team.id,
            password: team.password,
          },
          randomUUID(),
        ),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      (
        await x.sql`select count(*)::int n from memberships where left_at is null`
      )[0].n,
    ).toBe(2);
    expect((await x.sql`select count(*)::int n from applications`)[0].n).toBe(
      2,
    );
    const extra = randomUUID();
    await x.sql`insert into applications(id,event_id,full_name,email,phone,mode) values(${extra},${x.eventId},'DEMO','db@test.invalid','+905551234567','seeking')`;
    await expect(
      x.sql`insert into memberships(event_id,team_id,application_id) values(${x.eventId},${team.id},${extra})`,
    ).rejects.toThrow();
    await expect(
      x.sql`update teams set expected_size=1 where id=${team.id}`,
    ).rejects.toThrow();
  } finally {
    await x.cleanup();
  }
});
