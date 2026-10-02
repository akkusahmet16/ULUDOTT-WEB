import { z } from "zod";
export function normalizeTeamName(name: string): string {
  return z
    .string()
    .min(1)
    .max(100)
    .parse(name)
    .normalize("NFKC")
    .trim()
    .replace(/\s+/gu, " ")
    .toLocaleLowerCase("tr-TR");
}
