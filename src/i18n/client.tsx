"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { isAdminPathname } from "../config/theme.config.ts";
import {
  ADMIN_LOCALE,
  DEFAULT_LOCALE,
  resolveLocale,
  type ClientNamespace,
  type Locale,
} from "./config.ts";
import type { PublicDictionary } from "./dictionaries/tr.ts";
import type { DictionaryKey } from "./keys.ts";
import type { TranslateFn, TranslationParams } from "./translate.ts";

export type ClientDictionarySlice = Partial<
  Pick<PublicDictionary, ClientNamespace>
>;

export interface I18nContextValue {
  readonly locale: Locale;
  readonly t: TranslateFn;
}

const PLACEHOLDER_REGEX = /\{([a-zA-Z0-9_]+)\}/g;

function extractClientPlaceholders(template: string): string[] {
  const seen = new Set<string>();
  for (const match of template.matchAll(PLACEHOLDER_REGEX)) {
    if (match[1]) seen.add(match[1]);
  }
  return [...seen];
}

export function createSliceTranslator(
  slice: ClientDictionarySlice,
): TranslateFn {
  return (key: DictionaryKey, params?: TranslationParams): string => {
    const segments = String(key).split(".");
    let current: unknown = slice;
    for (const segment of segments) {
      if (
        current === null ||
        typeof current !== "object" ||
        !Object.prototype.hasOwnProperty.call(current, segment)
      ) {
        throw new Error(
          `Missing key "${String(key)}" in client dictionary slice`,
        );
      }
      current = (current as Readonly<Record<string, unknown>>)[segment];
    }
    if (typeof current !== "string") {
      throw new Error(
        `Dictionary key "${String(key)}" is not a leaf string in client slice`,
      );
    }
    const required = extractClientPlaceholders(current);
    if (required.length === 0) {
      return current;
    }
    for (const paramName of required) {
      if (
        !params ||
        !Object.prototype.hasOwnProperty.call(params, paramName) ||
        params[paramName] === undefined ||
        params[paramName] === null
      ) {
        throw new Error(
          `Missing translation parameter "${paramName}" for key "${String(key)}"`,
        );
      }
    }
    return current.replace(PLACEHOLDER_REGEX, (_m, paramName: string) =>
      String(params![paramName]),
    );
  };
}

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  readonly locale?: Locale;
  readonly forcedLocale?: Locale;
  readonly dictionary: ClientDictionarySlice;
  readonly children: ReactNode;
}

/**
 * İstemci dil sağlayıcısı (`I18nProvider`).
 * - Ekstra DOM düğümü (`<div>` vb.) üretmez; `body > main` seçicilerini korur.
 * - Görünür bir dil değiştirme kontrolü (`LanguageToggle` vb.) eklemez.
 * - `/admin` rotalarında `<html lang="tr">` değerini zorlar; genel rotalarda çözümlenen dili uygular.
 */
export function I18nProvider({
  locale = DEFAULT_LOCALE,
  forcedLocale,
  dictionary,
  children,
}: I18nProviderProps) {
  const pathname = usePathname();
  const effectiveLocale: Locale = forcedLocale
    ? resolveLocale(forcedLocale)
    : isAdminPathname(pathname)
      ? ADMIN_LOCALE
      : resolveLocale(locale);

  useEffect(() => {
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.lang = effectiveLocale;
    }
  }, [effectiveLocale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale: effectiveLocale,
      t: createSliceTranslator(dictionary),
    }),
    [effectiveLocale, dictionary],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLocale(): Locale {
  const context = useContext(I18nContext);
  if (!context) {
    return DEFAULT_LOCALE;
  }
  return context.locale;
}

export function useTranslator(): TranslateFn {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslator must be used within an I18nProvider");
  }
  return context.t;
}
