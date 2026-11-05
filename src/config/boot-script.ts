import {
  ADMIN_THEME,
  DEFAULT_THEME,
  THEMES,
  type ThemeId,
} from "./theme.config.ts";
import { STORAGE_KEYS } from "./storage-keys.ts";

export interface BootScriptConfig {
  readonly themeStorageKey: string;
  readonly introSeenStorageKey: string;
  readonly defaultTheme: ThemeId;
  readonly adminTheme: ThemeId;
  readonly allowedThemes: readonly ThemeId[];
  readonly adminPathPrefix: "/admin";
}

export const BOOT_SCRIPT_CONFIG: BootScriptConfig = {
  themeStorageKey: STORAGE_KEYS.theme,
  introSeenStorageKey: STORAGE_KEYS.introSeen,
  defaultTheme: DEFAULT_THEME,
  adminTheme: ADMIN_THEME,
  allowedThemes: THEMES,
  adminPathPrefix: "/admin",
} as const;

const SAFE_BOOT_TOKEN_RE = /^[a-z0-9/_-]+$/i;

export function assertSafeBootToken(value: string, label: string): string {
  if (!SAFE_BOOT_TOKEN_RE.test(value)) {
    throw new Error(`BOOT_SCRIPT_UNSAFE_TOKEN:${label}`);
  }
  return value;
}

export function buildBootScript(
  config: BootScriptConfig = BOOT_SCRIPT_CONFIG,
): string {
  const themeKey = assertSafeBootToken(config.themeStorageKey, "themeStorageKey");
  const introKey = assertSafeBootToken(config.introSeenStorageKey, "introSeenStorageKey");
  const defaultTheme = assertSafeBootToken(config.defaultTheme, "defaultTheme");
  const adminTheme = assertSafeBootToken(config.adminTheme, "adminTheme");
  const adminPrefix = assertSafeBootToken(config.adminPathPrefix, "adminPathPrefix");
  const allowedList = config.allowedThemes.map((t) =>
    assertSafeBootToken(t, "allowedTheme"),
  );
  if (allowedList.length === 0) {
    throw new Error("BOOT_SCRIPT_EMPTY_THEMES");
  }

  const serializedAllowed = JSON.stringify(allowedList);
  const serializedThemeKey = JSON.stringify(themeKey);
  const serializedIntroKey = JSON.stringify(introKey);
  const serializedDefault = JSON.stringify(defaultTheme);
  const serializedAdmin = JSON.stringify(adminTheme);
  const serializedAdminPrefix = JSON.stringify(adminPrefix);

  return [
    "(function(){",
    "var d=document.documentElement;",
    "if(!d)return;",
    `var def=${serializedDefault},adm=${serializedAdmin},pfx=${serializedAdminPrefix},allowed=${serializedAllowed};`,
    "var p=typeof location==='object'&&location&&typeof location.pathname==='string'?location.pathname:'';",
    "var isAdm=p===pfx||p.indexOf(pfx+'/')===0;",
    "var t=isAdm?adm:def;",
    "if(isAdm){d.setAttribute('lang','tr');}else{",
    "try{",
    `var raw=localStorage.getItem(${serializedThemeKey});`,
    "if(typeof raw==='string'&&allowed.indexOf(raw)!==-1){t=raw;}",
    "}catch(_){}",
    "}",
    "d.setAttribute('data-theme',t);",
    "try{",
    `if(sessionStorage.getItem(${serializedIntroKey})==='true'){d.setAttribute('data-intro-seen','true');}`,
    "}catch(_){}",
    "})();",
  ].join("");
}
