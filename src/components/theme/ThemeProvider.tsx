"use client";

import { createContext, useContext, useLayoutEffect, useSyncExternalStore, type ReactNode } from "react";
import { DEFAULT_THEME, type ThemeId } from "../../config/theme.config.ts";
import { getThemeSnapshot, restoreSavedTheme, setTheme, subscribeTheme } from "./theme-store.ts";

type ThemeContextValue = { theme: ThemeId; setTheme: (theme: ThemeId) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const getServerSnapshot = () => DEFAULT_THEME;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerSnapshot);
  // İlk boyamayı BootScript belirler. Next dev/StrictMode attribute sıfırlamasını
  // rehberdeki layout effect ile boyamadan önce onarır; useEffect kullanılmaz.
  useLayoutEffect(restoreSavedTheme, []);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw Error("ThemeProvider gerekli");
  return context;
}
