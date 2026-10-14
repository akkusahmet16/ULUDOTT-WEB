export const THEMES = ["arcade", "classic"] as const;
export type ThemeId = (typeof THEMES)[number];

export const DEFAULT_THEME: ThemeId = "arcade";
export const ADMIN_THEME: ThemeId = "classic";

export const THEME_REGISTRY: Record<ThemeId, { labelKey: string }> = {
  arcade: { labelKey: "theme.arcade" },
  classic: { labelKey: "theme.classic" },
};

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && THEMES.some(theme => theme === value);
}
