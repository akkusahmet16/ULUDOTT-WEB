export const LOCALES = ["tr", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "tr";

export const ADMIN_LOCALE: Locale = "tr";

export const LOCALE_TAGS: Readonly<Record<Locale, string>> = {
  tr: "tr-TR",
  en: "en-GB",
} as const;

export const APP_TIME_ZONE = "Europe/Istanbul" as const;

/**
 * Dil URL politikası (Faz 2 / İş 2A):
 * Mevcut Türkçe URL'ler ve cookie tabanlı dil korunur;
 * /en öneki veya hreflang alternatif URL'leri uydurulmaz.
 */
export const LOCALE_URL_POLICY = {
  strategy: "cookie-only",
  prefixLocaleInPath: false,
  generateHreflangAlternates: false,
} as const;

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (LOCALES as readonly string[]).includes(value)
  );
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
