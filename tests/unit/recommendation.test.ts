import { it, expect } from "vitest";
import { recommendTeams } from "../../src/modules/matching/domain/recommendation";
it("Dolu takım dışlanır, eksik beceri açıklanır, sıralama deterministiktir; üyelik değişmez", () => {
  const seeker = { skills: [{ skill: "visual_art" as const, level: 4 }] };
  const teams = [
    {
      id: "b",
      name: "DEMO b",
      expectedSize: 2,
      memberCount: 1,
      rosterRevision: 2,
      skills: [{ skill: "software" as const, level: 3 }],
    },
    {
      id: "a",
      name: "DEMO a",
      expectedSize: 2,
      memberCount: 1,
      rosterRevision: 2,
      skills: [{ skill: "visual_art" as const, level: 5 }],
    },
    {
      id: "full",
      name: "DEMO dolu",
      expectedSize: 1,
      memberCount: 1,
      rosterRevision: 2,
      skills: [],
    },
  ];
  const before = JSON.stringify(teams),
    r = recommendTeams(seeker, teams);
  expect(r.map((x) => x.id)).toEqual(["b", "a"]);
  expect(r[0].reasons.join(" ")).toMatch(/Görsel sanat.*4/);
  expect(recommendTeams(seeker, [...teams].reverse())).toEqual(r);
  expect(JSON.stringify(teams)).toBe(before);
});
