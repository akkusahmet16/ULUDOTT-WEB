import { DEFAULT_LOCALE, isLocale, type Locale } from "./config.ts";
import { enDictionary } from "./dictionaries/en.ts";
import { trDictionary, type PublicDictionary } from "./dictionaries/tr.ts";
import {
  extractPlaceholders,
  isDictionaryKey,
  type DictionaryKey,
} from "./keys.ts";

export type TranslationParams = Readonly<Record<string, string | number>>;

export type TranslateFn = (
  key: DictionaryKey,
  params?: TranslationParams,
) => string;

const DICTIONARIES: Readonly<Record<Locale, PublicDictionary>> = {
  tr: trDictionary,
  en: enDictionary,
} as const;

export function getDictionary(locale: Locale = DEFAULT_LOCALE): PublicDictionary {
  if (!isLocale(locale)) {
    throw new Error(`Unsupported locale: "${String(locale)}"`);
  }
  return DICTIONARIES[locale];
}

function resolveLeafValue(
  dictionary: PublicDictionary,
  key: string,
): string {
  if (!isDictionaryKey(key)) {
    throw new Error(`Missing or non-leaf dictionary key: "${key}"`);
  }
  const segments = key.split(".");
  let current: unknown = dictionary;
  for (const segment of segments) {
    if (
      current === null ||
      typeof current !== "object" ||
      !Object.prototype.hasOwnProperty.call(current, segment)
    ) {
      throw new Error(`Missing dictionary key: "${key}"`);
    }
    current = (current as Readonly<Record<string, unknown>>)[segment];
  }
  if (typeof current !== "string") {
    throw new Error(`Dictionary key is not a leaf string: "${key}"`);
  }
  return current;
}

function interpolateTemplate(
  key: DictionaryKey,
  template: string,
  params?: TranslationParams,
): string {
  const requiredParams = extractPlaceholders(template);
  if (requiredParams.length === 0) {
    return template;
  }
  for (const paramName of requiredParams) {
    if (
      !params ||
      !Object.prototype.hasOwnProperty.call(params, paramName) ||
      params[paramName] === undefined ||
      params[paramName] === null
    ) {
      throw new Error(
        `Missing translation parameter "${paramName}" for key "${key}"`,
      );
    }
  }
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, paramName: string) =>
    String(params![paramName]),
  );
}

/**
 * İstek dışı saf çeviri üreticisi.
 * İstek çerezini okuyan sunucu yardımcısı Faz 3A'da `src/i18n/server.ts` içinde
 * `getRequestTranslator()` adıyla tanımlanır; aynı ada farklı imza yüklenmez.
 */
export function getTranslator(locale: Locale = DEFAULT_LOCALE): TranslateFn {
  const dictionary = getDictionary(locale);
  return (key: DictionaryKey, params?: TranslationParams): string => {
    const template = resolveLeafValue(dictionary, String(key));
    return interpolateTemplate(key, template, params);
  };
}
