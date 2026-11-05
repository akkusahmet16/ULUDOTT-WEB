export const THEMES = ["cinematic", "classic"] as const;

export type ThemeId = (typeof THEMES)[number];

export const DEFAULT_THEME: ThemeId = "cinematic";

export const ADMIN_THEME: ThemeId = "classic";

export interface ThemeDefinition {
  readonly id: ThemeId;
  readonly labelKey: string;
  readonly colorScheme: "dark";
  readonly scope: "public" | "admin";
}

export const THEME_REGISTRY: Readonly<Record<ThemeId, ThemeDefinition>> = {
  cinematic: {
    id: "cinematic",
    labelKey: "theme.cinematic",
    colorScheme: "dark",
    scope: "public",
  },
  classic: {
    id: "classic",
    labelKey: "theme.classic",
    colorScheme: "dark",
    scope: "admin",
  },
} as const;

export function isThemeId(value: unknown): value is ThemeId {
  return (
    typeof value === "string" &&
    (THEMES as readonly string[]).includes(value)
  );
}

export function isAdminPathname(pathname: string | null | undefined): boolean {
  if (typeof pathname !== "string") return false;
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function resolveRuntimeTheme(options: {
  pathname?: string | null;
  storedTheme?: unknown;
  forcedTheme?: ThemeId;
}): ThemeId {
  if (options.forcedTheme && isThemeId(options.forcedTheme)) {
    return options.forcedTheme;
  }
  if (isAdminPathname(options.pathname)) {
    return ADMIN_THEME;
  }
  if (isThemeId(options.storedTheme)) {
    return options.storedTheme;
  }
  return DEFAULT_THEME;
}
