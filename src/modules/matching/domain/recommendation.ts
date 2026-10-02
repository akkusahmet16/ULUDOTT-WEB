import { skillKeys, skillLabels, type Skill } from "./skills.ts";
export type SkillLevel = { skill: Skill; level: number };
export type AvailableTeam = {
  id: string;
  name: string;
  expectedSize: number;
  memberCount: number;
  rosterRevision: number;
  skills: SkillLevel[];
};
export type ExplainedRecommendation = AvailableTeam & {
  score: number;
  reasons: string[];
};
export function recommendTeams(
  seeker: { skills: SkillLevel[] },
  availableTeams: AvailableTeam[],
): ExplainedRecommendation[] {
  return availableTeams
    .filter((t) => t.memberCount < t.expectedSize)
    .map((t) => {
      let score = 0;
      const reasons: string[] = [];
      for (const skill of skillKeys) {
        const level = Math.max(
          0,
          ...seeker.skills.filter((s) => s.skill === skill).map((s) => s.level),
        );
        if (!level) continue;
        const current = Math.max(
          0,
          ...t.skills.filter((s) => s.skill === skill).map((s) => s.level),
        );
        const gain = Math.max(0, level - current);
        score += (current === 0 ? 100 : 0) + gain * 10 + level;
        reasons.push(
          `${skillLabels[skill]} ${level}/5: ${current === 0 ? "takımda bulunmayan beceri" : gain > 0 ? "takımın en yüksek seviyesini " + current + " → " + level + " yükseltir" : "takımda mevcut beceriye destek"}.`,
        );
      }
      return { ...t, score, reasons };
    })
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id, "en"));
}
