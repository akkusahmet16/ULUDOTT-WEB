import { it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";
import {
  loginTeam,
  requireTeamSession,
  rotateTeamAccess,
  getTeamView,
  TEAM_COOKIE,
} from "../../src/modules/teams/application/team-access";
it("takım oturum izolasyonu, güçlü hash, yenileme/eski token-parola, hız limiti ve gizli veri", async () => {
  const x = await ulujamFixture();
  try {
    const a = (await submitUlujam(x.input("new"), randomUUID())).team;
    if (!a?.password) throw Error("Team receipt missing");
    const [stored] =
      await x.sql`select * from team_access where team_id=${a.id}`;
    expect(stored.password_hash).toMatch(/^\$argon2id/);
    expect(stored.token_hash).not.toBe(a.token);
    const login = await loginTeam(a.token, a.password);
    const req = new Request("https://test.invalid", {
      headers: { cookie: TEAM_COOKIE + "=" + login.token },
    });
    expect(await requireTeamSession(req, a.id)).toBeTruthy();
    await expect(requireTeamSession(req, randomUUID())).rejects.toThrow();
    const view = JSON.stringify(await getTeamView(a.token, req));
    for (const text of [
      "+905551234567",
      "@test.invalid",
      a.password,
      login.token,
      "skillDescription",
    ])
      expect(view).not.toContain(text);
    const fresh = await rotateTeamAccess(x.actor, a.id);
    await expect(requireTeamSession(req, a.id)).rejects.toThrow();
    await expect(loginTeam(a.token, a.password)).rejects.toThrow();
    await expect(loginTeam(fresh.token, a.password)).rejects.toThrow();
    expect(await loginTeam(fresh.token, fresh.password)).toBeTruthy();
    // Keep the rate-limit assertions in one fixed minute window.
    vi.spyOn(Date, "now").mockReturnValue(Date.now());
    for (let i = 0; i < 12; i++)
      await loginTeam(fresh.token, "wrong").catch(() => {});
    await expect(loginTeam(fresh.token, "wrong")).rejects.toMatchObject({
      status: 429,
    });
  } finally {
    vi.restoreAllMocks();
    await x.cleanup();
  }
});
