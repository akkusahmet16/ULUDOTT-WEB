"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { STORAGE_KEYS } from "../../config/storage-keys.ts";
import {
  ADMIN_THEME,
  DEFAULT_THEME,
  THEME_REGISTRY,
  isAdminPathname,
  isThemeId,
  resolveRuntimeTheme,
  type ThemeDefinition,
  type ThemeId,
} from "../../config/theme.config.ts";

export interface ThemeContextValue {
  readonly theme: ThemeId;
  readonly definition: ThemeDefinition;
  readonly setTheme: (next: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const listeners = new Set<() => void>();

function emitThemeChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribeThemeStore(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  if (typeof window === "undefined") {
    return () => {
      listeners.delete(onStoreChange);
    };
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEYS.theme) {
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function safeReadStoredTheme(): ThemeId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.theme);
    return isThemeId(raw) ? raw : null;
  } catch {
    return null;
  }
}

export interface ThemeProviderProps {
  readonly children: ReactNode;
  readonly forcedTheme?: ThemeId;
}

export function ThemeProvider({ children, forcedTheme }: ThemeProviderProps) {
  const pathname = usePathname();
  const effectiveForcedTheme =
    forcedTheme ?? (isAdminPathname(pathname) ? ADMIN_THEME : undefined);

  const getClientSnapshot = useCallback((): ThemeId => {
    if (effectiveForcedTheme) {
      return effectiveForcedTheme;
    }
    const locPathname =
      pathname ??
      (typeof window !== "undefined" ? window.location.pathname : "");
    return resolveRuntimeTheme({
      pathname: locPathname,
      storedTheme: safeReadStoredTheme(),
    });
  }, [effectiveForcedTheme, pathname]);

  const getServerSnapshot = useCallback((): ThemeId => {
    return effectiveForcedTheme ?? DEFAULT_THEME;
  }, [effectiveForcedTheme]);

  const theme = useSyncExternalStore(
    subscribeThemeStore,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback(
    (next: ThemeId) => {
      if (!isThemeId(next)) return;
      if (effectiveForcedTheme) {
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute(
            "data-theme",
            effectiveForcedTheme,
          );
        }
        return;
      }
      try {
        window.localStorage.setItem(STORAGE_KEYS.theme, next);
      } catch {
        // Ignore storage SecurityError/QuotaExceededError and preserve runtime state
      }
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", next);
      }
      emitThemeChange();
    },
    [effectiveForcedTheme],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      definition: THEME_REGISTRY[theme],
      setTheme,
    }),
    [theme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
