import { z } from "zod";
export const skillKeys = [
  "software",
  "game_design",
  "visual_art",
  "audio_music",
  "narrative",
] as const;
export type Skill = (typeof skillKeys)[number];
export const skillLabels: Record<Skill, string> = {
  software: "Yazılım",
  game_design: "Oyun tasarımı",
  visual_art: "Görsel sanat",
  audio_music: "Ses-müzik",
  narrative: "Anlatı",
};
export const skillSchema = z.strictObject({
  skill: z.enum(skillKeys),
  level: z.int().min(1).max(5),
});
export const skillsSchema = z
  .array(skillSchema)
  .min(1)
  .max(skillKeys.length)
  .refine(
    (a) => new Set(a.map((s) => s.skill)).size === a.length,
    "Tekrarlı beceri",
  );
