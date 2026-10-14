"use client";

import { DEFAULT_THEME, isThemeId, type ThemeId } from "../../config/theme.config.ts";
import { STORAGE_KEYS } from "../../config/storage-keys.ts";

const CHANGE_EVENT = "uludott:theme-change";

export function getThemeSnapshot(): ThemeId {
  const value = document.documentElement.dataset.theme;
  return isThemeId(value) ? value : DEFAULT_THEME;
}

function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function setTheme(theme: ThemeId): void {
  if (!isThemeId(theme)) return;
  applyTheme(theme);
  try { window.localStorage.setItem(STORAGE_KEYS.theme, theme); } catch { /* Depo kapalıyken DOM tercihi kullanılabilir. */ }
}

export function restoreSavedTheme(): void {
  let theme = DEFAULT_THEME;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEYS.theme);
    if (isThemeId(saved)) theme = saved;
  } catch { /* Boot ile aynı güvenli varsayılan. */ }
  applyTheme(theme);
}

export function subscribeTheme(notify: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEYS.theme && event.key !== null) return;
    applyTheme(isThemeId(event.newValue) ? event.newValue : DEFAULT_THEME);
  };
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.addEventListener(CHANGE_EVENT, notify);
  window.addEventListener("storage", onStorage);
  return () => {
    observer.disconnect();
    window.removeEventListener(CHANGE_EVENT, notify);
    window.removeEventListener("storage", onStorage);
  };
}
